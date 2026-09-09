"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Sparkles,
  MessageSquare,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle2,
  MessageCircle,
  BarChart3,
  Users,
  Target,
  DollarSign,
  Activity,
  Eye,
  Package,
  Star,
} from "lucide-react";
import {
  subscribeChatAnalytics,
  type ChatAnalyticsSummary,
  type ChatEvent,
} from "@/lib/firebase/firestore";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/features/auth/AuthProvider";

// ── Types ──────────────────────────────────────────────────

interface ChatSession {
  sessionId: string;
  events: ChatEvent[];
  startTime: Date | null;
  endTime: Date | null;
  durationSeconds: number;
  formattedDuration: string;
  interactionCount: number;
  recommendedProductsCount: number;
  cartAddsCount: number;
  totalCartValue: number;
  status: "converted" | "recommended" | "inquiry";
}

// ── Helpers ────────────────────────────────────────────────

function toMs(t: unknown): number {
  if (!t) return 0;
  if (typeof t === "object" && t !== null) {
    if ("toMillis" in t && typeof (t as { toMillis: () => number }).toMillis === "function") {
      return (t as { toMillis: () => number }).toMillis();
    }
    if ("seconds" in t && typeof (t as { seconds: number }).seconds === "number") {
      return (t as { seconds: number }).seconds * 1000;
    }
  }
  if (t instanceof Date) return t.getTime();
  if (typeof t === "number" && t > 0) return t;
  return 0;
}

function formatRelative(t: unknown): string {
  const ms = toMs(t);
  if (!ms) return "منذ فترة";
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 60) return `منذ ${sec}ث`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `منذ ${min}د`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `منذ ${hr}س`;
  return `منذ ${Math.floor(hr / 24)} يوم`;
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}ث`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}د ${s}ث` : `${m}د`;
}

function formatPrice(v: number): string {
  return `${v.toLocaleString("ar-EG")} ج.م`;
}

// ── Mini Bar ────────────────────────────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

// ── Sparkline ───────────────────────────────────────────────

function Sparkline({ data, color = "#10b981" }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 80;
  const h = 32;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - (v / max) * (h - 4)}`).join(" ");
  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Hourly Bar Chart ────────────────────────────────────────

function HourlyChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-16 w-full">
      {data.map((v, i) => (
        <motion.div
          key={i}
          className="flex-1 bg-violet-500 dark:bg-violet-400 rounded-t-sm min-w-0 opacity-75 hover:opacity-100 transition-opacity cursor-default"
          style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
          initial={{ scaleY: 0, originY: "bottom" }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.4, delay: i * 0.01 }}
          title={`${i}:00 — ${v} حدث`}
        />
      ))}
    </div>
  );
}

// ── Status Badge ────────────────────────────────────────────

function StatusBadge({ status }: { status: ChatSession["status"] }) {
  const map = {
    converted: { label: "تحول لشراء", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
    recommended: { label: "أُوصي بمنتج", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
    inquiry: { label: "استفسار", cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  };
  const { label, cls } = map[status];
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

// ══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════

export default function AdminChatAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<ChatAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "converted" | "recommended" | "inquiry">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sessions" | "products" | "activity">("sessions");

  useEffect(() => {
    if (authLoading || !user) return;
    const unsub = subscribeChatAnalytics((s) => { setData(s); setLoading(false); });
    return () => unsub();
  }, [user, authLoading]);

  // ── Build Sessions ──────────────────────────────────────
  const sessions = useMemo<ChatSession[]>(() => {
    const raw = data?.events || [];
    const map = new Map<string, ChatEvent[]>();
    raw.forEach((ev) => {
      const sid = ev.sessionId || "unknown";
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid)!.push(ev);
    });
    return Array.from(map.entries()).map(([sessionId, evs]) => {
      const sorted = [...evs].sort((a, b) => toMs(a.timestamp) - toMs(b.timestamp));
      const times = sorted.map((e) => toMs(e.timestamp)).filter(Boolean);
      const startTime = times.length ? new Date(Math.min(...times)) : null;
      const endTime = times.length ? new Date(Math.max(...times)) : null;
      const durationSeconds = startTime && endTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;
      const cartEvs = evs.filter((e) => e.type === "add_to_cart_click");
      const recEvs = evs.filter((e) => e.type === "product_recommended");
      const msgEvs = evs.filter((e) => e.type === "user_message");
      const totalCartValue = cartEvs.reduce((s, e) => s + (e.price || 0), 0);
      const status: ChatSession["status"] = cartEvs.length > 0 ? "converted" : recEvs.length > 0 ? "recommended" : "inquiry";
      return { sessionId, events: sorted, startTime, endTime, durationSeconds, formattedDuration: formatDuration(durationSeconds), interactionCount: msgEvs.length, recommendedProductsCount: recEvs.length, cartAddsCount: cartEvs.length, totalCartValue, status };
    }).sort((a, b) => (b.endTime?.getTime() ?? 0) - (a.endTime?.getTime() ?? 0));
  }, [data]);

  // ── Hourly distribution ─────────────────────────────────
  const hourlyData = useMemo<number[]>(() => {
    const arr = new Array(24).fill(0);
    (data?.events || []).forEach((ev) => { const ms = toMs(ev.timestamp); if (ms) arr[new Date(ms).getHours()]++; });
    return arr;
  }, [data]);

  // ── 14-day daily trend ──────────────────────────────────
  const dailyTrend = useMemo<{ label: string; count: number }[]>(() => {
    const map: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); map[d.toISOString().slice(0, 10)] = 0; }
    (data?.events || []).forEach((ev) => { const ms = toMs(ev.timestamp); if (!ms) return; const key = new Date(ms).toISOString().slice(0, 10); if (key in map) map[key]++; });
    return Object.entries(map).map(([date, count]) => ({ label: new Date(date).toLocaleDateString("ar-EG", { day: "numeric", month: "numeric" }), count }));
  }, [data]);

  const dailyCounts = dailyTrend.map((d) => d.count);
  const maxDaily = Math.max(...dailyCounts, 1);

  // ── Filtered sessions ───────────────────────────────────
  const filtered = useMemo(() => sessions.filter((s) => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.sessionId.toLowerCase().includes(q) || s.events.some((e) => (e.productName || "").toLowerCase().includes(q));
  }), [sessions, filterStatus, searchQuery]);

  // ── Derived KPIs ────────────────────────────────────────
  const convertedSessions = sessions.filter((s) => s.status === "converted").length;
  const conversionRate = sessions.length > 0 ? Math.round((convertedSessions / sessions.length) * 1000) / 10 : 0;
  const avgDuration = sessions.length > 0 ? Math.floor(sessions.reduce((a, s) => a + s.durationSeconds, 0) / sessions.length) : 0;
  const totalRevenue = sessions.reduce((a, s) => a + s.totalCartValue, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Spinner size="lg" />
        <p className="text-xs text-zinc-400 tracking-widest uppercase">جارٍ تحميل تحليلات الشات بوت...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20" dir="rtl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">تحليلات شات بوت LUNO</h1>
            <p className="text-xs text-zinc-400">مراقبة لحظية لكل محادثة وتحويل</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">مباشر الآن</span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "إجمالي المحادثات", value: sessions.length, icon: <MessageCircle size={18} />, iconBg: "bg-blue-50 dark:bg-blue-950/40", iconColor: "text-blue-500", trend: dailyCounts.slice(-7), trendColor: "#3b82f6" },
          { label: "معدل التحويل", value: `${conversionRate}%`, icon: <Target size={18} />, iconBg: "bg-emerald-50 dark:bg-emerald-950/40", iconColor: "text-emerald-500", trend: null as number[] | null, trendColor: "#10b981" },
          { label: "إيرادات الشات", value: formatPrice(totalRevenue), icon: <DollarSign size={18} />, iconBg: "bg-amber-50 dark:bg-amber-950/40", iconColor: "text-amber-500", trend: null as number[] | null, trendColor: "#f59e0b" },
          { label: "متوسط المدة", value: formatDuration(avgDuration), icon: <Clock size={18} />, iconBg: "bg-violet-50 dark:bg-violet-950/40", iconColor: "text-violet-500", trend: null as number[] | null, trendColor: "#8b5cf6" },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{card.label}</span>
              <div className={`${card.iconBg} ${card.iconColor} w-8 h-8 rounded-xl flex items-center justify-center`}>{card.icon}</div>
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-white">{card.value}</div>
            {card.trend && <Sparkline data={card.trend} color={card.trendColor} />}
          </motion.div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} className="text-violet-500" />
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">نشاط الشات — بالساعة</h2>
          </div>
          <HourlyChart data={hourlyData} />
          <div className="flex justify-between mt-1.5">
            {["12ص", "6ص", "12م", "6م", "12ص"].map((l, i) => <span key={i} className="text-[10px] text-zinc-400">{l}</span>)}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">الأحداث — آخر 14 يوم</h2>
          </div>
          <div className="flex items-end gap-0.5 h-20 w-full">
            {dailyTrend.map((d, i) => (
              <motion.div key={i}
                className="flex-1 bg-blue-500 dark:bg-blue-400 rounded-t-sm opacity-75 hover:opacity-100 transition-opacity cursor-default"
                style={{ height: `${Math.max(4, (d.count / maxDaily) * 72)}px` }}
                initial={{ scaleY: 0, originY: "bottom" }} animate={{ scaleY: 1 }}
                transition={{ delay: 0.1 + i * 0.03 }} title={`${d.label}: ${d.count}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-zinc-400">{dailyTrend[0]?.label}</span>
            <span className="text-[10px] text-zinc-400">{dailyTrend[dailyTrend.length - 1]?.label}</span>
          </div>
        </motion.div>
      </div>

      {/* ── Conversion Breakdown ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.37 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-5">
          <Zap size={14} className="text-amber-500" />
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">توزيع نتائج المحادثات</h2>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "تحولت لشراء", count: convertedSessions, barColor: "bg-emerald-500", textColor: "text-emerald-600 dark:text-emerald-400", icon: <CheckCircle2 size={13} /> },
            { label: "أُوصي بمنتج", count: sessions.filter((s) => s.status === "recommended").length, barColor: "bg-blue-500", textColor: "text-blue-600 dark:text-blue-400", icon: <Star size={13} /> },
            { label: "استفسار فقط", count: sessions.filter((s) => s.status === "inquiry").length, barColor: "bg-zinc-400", textColor: "text-zinc-500 dark:text-zinc-400", icon: <MessageSquare size={13} /> },
          ].map((item, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className={`flex items-center gap-1.5 ${item.textColor}`}>{item.icon}<span className="text-xs font-medium">{item.label}</span></div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">{item.count}</div>
              <MiniBar value={item.count} max={sessions.length || 1} color={item.barColor} />
              <span className="text-[10px] text-zinc-400">{sessions.length > 0 ? `${Math.round((item.count / sessions.length) * 100)}%` : "0%"}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Tabbed Panel ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden"
      >
        {/* Tab bar */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          {(["sessions", "products", "activity"] as const).map((tab) => {
            const labels = { sessions: "المحادثات", products: "أكثر المنتجات", activity: "سجل الأحداث" };
            const icons = { sessions: <Users size={13} />, products: <Package size={13} />, activity: <Eye size={13} /> };
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors cursor-pointer ${activeTab === tab ? "border-b-2 border-violet-500 text-violet-600 dark:text-violet-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
              >
                {icons[tab]}{labels[tab]}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Sessions ── */}
          {activeTab === "sessions" && (
            <motion.div key="sessions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col sm:flex-row gap-2 p-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="relative flex-1">
                  <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث بـ session أو منتج..."
                    className="w-full pr-8 pl-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none" dir="rtl"
                  />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(["all", "converted", "recommended", "inquiry"] as const).map((f) => {
                    const labels = { all: "الكل", converted: "شراء", recommended: "توصية", inquiry: "استفسار" };
                    return (
                      <button key={f} onClick={() => setFilterStatus(f)}
                        className={`text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${filterStatus === f ? "bg-violet-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
                      >
                        {labels[f]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[520px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="py-16 text-center text-zinc-400 text-sm">لا توجد محادثات</div>
                ) : filtered.map((s) => (
                  <div key={s.sessionId}>
                    <button className="w-full text-right px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === s.sessionId ? null : s.sessionId)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${s.status === "converted" ? "bg-emerald-100 dark:bg-emerald-900/40" : s.status === "recommended" ? "bg-blue-100 dark:bg-blue-900/40" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                            {s.status === "converted" ? <CheckCircle2 size={14} className="text-emerald-600" /> : s.status === "recommended" ? <Sparkles size={14} className="text-blue-500" /> : <MessageSquare size={14} className="text-zinc-400" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-mono text-zinc-500 truncate max-w-[120px]">{s.sessionId.slice(-14)}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <StatusBadge status={s.status} />
                              {s.cartAddsCount > 0 && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">+{s.cartAddsCount} سلة</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="hidden sm:flex flex-col items-end gap-0.5">
                            <span className="text-[10px] text-zinc-400">{s.formattedDuration}</span>
                            <span className="text-[10px] text-zinc-400">{s.interactionCount} رسالة</span>
                          </div>
                          {s.totalCartValue > 0 && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(s.totalCartValue)}</span>}
                          <span className="text-zinc-300 dark:text-zinc-600">{expandedId === s.sessionId ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                        </div>
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedId === s.sessionId && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-zinc-50 dark:bg-zinc-800/30">
                          <div className="px-4 pb-4 pt-3 space-y-2.5">
                            <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">تفاصيل الجلسة</div>
                            {s.events.map((ev, i) => (
                              <div key={i} className="flex items-start gap-2.5">
                                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${ev.type === "add_to_cart_click" ? "bg-emerald-500" : ev.type === "product_recommended" ? "bg-blue-500" : ev.type === "chat_started" ? "bg-violet-500" : "bg-zinc-300"}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                                      {ev.type === "chat_started" ? "🚀 بدأ المحادثة" : ev.type === "user_message" ? `💬 "${ev.messageText?.slice(0, 45) || "رسالة"}"` : ev.type === "product_recommended" ? `⭐ أُوصي بـ ${ev.productName || "منتج"}` : ev.type === "add_to_cart_click" ? `🛒 أضاف "${ev.productName || "منتج"}" للسلة` : ev.type}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 flex-shrink-0">{formatRelative(ev.timestamp)}</span>
                                  </div>
                                  {ev.type === "add_to_cart_click" && ev.price && (
                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                                      {formatPrice(ev.price)}{ev.selectedSize && ` · ${ev.selectedSize}`}{ev.selectedColor && ` · ${ev.selectedColor}`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Top Products ── */}
          {activeTab === "products" && (
            <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-4">
              {data?.topProducts && data.topProducts.length > 0 ? (
                data.topProducts.map((p, i) => (
                  <motion.div key={p.productId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" : i === 1 ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400"}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{p.name}</span>
                        <span className="text-xs font-bold text-violet-600 dark:text-violet-400 flex-shrink-0 mr-2">{p.count} مرة</span>
                      </div>
                      <MiniBar value={p.count} max={data.topProducts[0]?.count || 1} color={i === 0 ? "bg-amber-500" : i === 1 ? "bg-zinc-400" : "bg-violet-500"} />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-16 text-center text-zinc-400 text-sm">لا توجد بيانات منتجات بعد</div>
              )}
            </motion.div>
          )}

          {/* ── Activity Feed ── */}
          {activeTab === "activity" && (
            <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-h-[520px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
              {(data?.events || []).length === 0 ? (
                <div className="py-16 text-center text-zinc-400 text-sm">لا توجد أحداث مسجلة</div>
              ) : (
                [...(data?.events || [])].sort((a, b) => toMs(b.timestamp) - toMs(a.timestamp)).slice(0, 120).map((ev, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ev.type === "add_to_cart_click" ? "bg-emerald-500" : ev.type === "product_recommended" ? "bg-blue-500" : ev.type === "chat_started" ? "bg-violet-500" : "bg-zinc-300"}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-zinc-700 dark:text-zinc-300">
                        {ev.type === "chat_started" ? "🚀 محادثة جديدة" : ev.type === "user_message" ? `💬 ${ev.messageText?.slice(0, 55) || "رسالة مستخدم"}` : ev.type === "product_recommended" ? `⭐ توصية: ${ev.productName || ""}` : ev.type === "add_to_cart_click" ? `🛒 إضافة للسلة: ${ev.productName || ""}` : ev.type}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 flex-shrink-0">{formatRelative(ev.timestamp)}</span>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
