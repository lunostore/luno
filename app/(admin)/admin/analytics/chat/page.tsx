"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Sparkles,
  MessageSquare,
  ShoppingCart,
  TrendingUp,
  Award,
  RefreshCw,
  Clock,
  Shirt,
  Search,
  ChevronDown,
  ChevronUp,
  Flame,
  Zap,
  Timer,
  CheckCircle2,
  Filter,
  Layers,
  ListFilter,
  MessageCircle,
} from "lucide-react";
import {
  subscribeChatAnalytics,
  type ChatAnalyticsSummary,
  type ChatEvent,
} from "@/lib/firebase/firestore";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/features/auth/AuthProvider";

// ── Session Structure Types ──────────────────────────────

interface ChatSession {
  sessionId: string;
  events: ChatEvent[];
  startTime: Date | null;
  endTime: Date | null;
  durationSeconds: number;
  formattedDuration: string;
  isLongChat: boolean;
  chatDepth: "long" | "medium" | "short";
  interactionCount: number;
  recommendedProductsCount: number;
  cartAddsCount: number;
  totalCartValue: number;
  status: "converted" | "recommended" | "inquiry";
}

export default function AdminChatAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<ChatAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "converted" | "long" | "recommended" | "short">("all");
  const [activeTab, setActiveTab] = useState<"sessions" | "top_products" | "live_feed">("sessions");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    const unsubscribe = subscribeChatAnalytics((summary) => {
      setData(summary);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  // Format relative timestamp helper
  const formatRelativeTime = (timestamp: unknown): string => {
    if (!timestamp) return "منذ فترة قصيرة";
    let ms = 0;
    const ts = timestamp as Record<string, unknown> & { toMillis?: () => number; seconds?: number };
    if (typeof ts?.toMillis === "function") ms = ts.toMillis();
    else if (ts?.seconds) ms = ts.seconds * 1000;
    else if (ts instanceof Date) ms = ts.getTime();

    if (!ms) return "منذ فترة قصيرة";
    const diffSec = Math.floor((Date.now() - ms) / 1000);
    if (diffSec < 60) return `منذ ${diffSec} ثانية`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  };

  // Group raw events into clean Sessions
  const sessions = useMemo<ChatSession[]>(() => {
    const rawEvents = data?.events || [];
    const map = new Map<string, ChatEvent[]>();

    rawEvents.forEach((ev) => {
      const sId = ev.sessionId || "session_unknown";
      if (!map.has(sId)) {
        map.set(sId, []);
      }
      map.get(sId)!.push(ev);
    });

    const sessionList: ChatSession[] = [];

    map.forEach((sessionEvents, sessionId) => {
      const getMs = (timestamp: unknown): number => {
        if (!timestamp) return 0;
        const ts = timestamp as Record<string, unknown> & { toMillis?: () => number; seconds?: number };
        if (typeof ts?.toMillis === "function") return ts.toMillis();
        if (ts?.seconds) return ts.seconds * 1000;
        if (ts instanceof Date) return ts.getTime();
        return 0;
      };

      // Sort events chronologically ascending
      const sortedEvents = [...sessionEvents].sort((a, b) => getMs(a.timestamp) - getMs(b.timestamp));

      const firstEv = sortedEvents[0];
      const lastEv = sortedEvents[sortedEvents.length - 1];

      const startMs = getMs(firstEv?.timestamp);
      const endMs = getMs(lastEv?.timestamp);

      const startTime = startMs ? new Date(startMs) : null;
      const endTime = endMs ? new Date(endMs) : null;

      let durationSeconds = 0;
      if (startMs && endMs && endMs >= startMs) {
        durationSeconds = Math.floor((endMs - startMs) / 1000);
      }

      // Format duration text
      let formattedDuration = "أقل من ثانية";
      if (durationSeconds > 0) {
        const mins = Math.floor(durationSeconds / 60);
        const secs = durationSeconds % 60;
        if (mins > 0 && secs > 0) {
          formattedDuration = `${mins} دقيقة و ${secs} ثانية`;
        } else if (mins > 0) {
          formattedDuration = `${mins} دقيقة`;
        } else {
          formattedDuration = `${secs} ثانية`;
        }
      }

      const interactionCount = sortedEvents.length;
      const recommendedProductsCount = sortedEvents.filter((e) => e.type === "product_recommended").length;

      let cartAddsCount = 0;
      let totalCartValue = 0;

      sortedEvents.forEach((e) => {
        if (e.type === "add_to_cart_click") {
          cartAddsCount++;
          if (e.price) totalCartValue += e.price;
        }
      });

      // Chat Depth Classification
      // Long Chat: duration >= 180s (3m) OR interactions >= 5
      // Medium Chat: duration >= 45s OR interactions >= 3
      // Short Chat: otherwise
      let chatDepth: "long" | "medium" | "short" = "short";
      if (durationSeconds >= 180 || interactionCount >= 5) {
        chatDepth = "long";
      } else if (durationSeconds >= 45 || interactionCount >= 3) {
        chatDepth = "medium";
      }

      const isLongChat = chatDepth === "long";

      let status: "converted" | "recommended" | "inquiry" = "inquiry";
      if (cartAddsCount > 0) {
        status = "converted";
      } else if (recommendedProductsCount > 0) {
        status = "recommended";
      }

      sessionList.push({
        sessionId,
        events: sortedEvents,
        startTime,
        endTime,
        durationSeconds,
        formattedDuration,
        isLongChat,
        chatDepth,
        interactionCount,
        recommendedProductsCount,
        cartAddsCount,
        totalCartValue,
        status,
      });
    });

    // Sort by newest session end time
    return sessionList.sort((a, b) => {
      const aMs = a.endTime ? a.endTime.getTime() : 0;
      const bMs = b.endTime ? b.endTime.getTime() : 0;
      return bMs - aMs;
    });
  }, [data]);

  // Aggregate Duration & Depth Metrics
  const aggregateMetrics = useMemo(() => {
    const totalCount = sessions.length;
    if (totalCount === 0) {
      return {
        avgDurationSec: 0,
        formattedAvgDuration: "0 ثانية",
        longChatsCount: 0,
        mediumChatsCount: 0,
        shortChatsCount: 0,
        longChatPercentage: 0,
        mediumChatPercentage: 0,
        shortChatPercentage: 0,
        longChatConversionRate: 0,
        shortChatConversionRate: 0,
      };
    }

    let totalDurationSec = 0;
    let longCount = 0;
    let mediumCount = 0;
    let shortCount = 0;
    let longCartAdds = 0;
    let shortCartAdds = 0;

    sessions.forEach((s) => {
      totalDurationSec += s.durationSeconds;
      if (s.chatDepth === "long") {
        longCount++;
        if (s.cartAddsCount > 0) longCartAdds++;
      } else if (s.chatDepth === "medium") {
        mediumCount++;
      } else {
        shortCount++;
        if (s.cartAddsCount > 0) shortCartAdds++;
      }
    });

    const avgSec = Math.round(totalDurationSec / totalCount);
    const mins = Math.floor(avgSec / 60);
    const secs = avgSec % 60;
    const formattedAvgDuration =
      mins > 0 ? (secs > 0 ? `${mins} دقيقة و ${secs} ثانية` : `${mins} دقيقة`) : `${secs} ثانية`;

    const longChatConversionRate = longCount > 0 ? Math.round((longCartAdds / longCount) * 100) : 0;
    const shortChatConversionRate = shortCount > 0 ? Math.round((shortCartAdds / shortCount) * 100) : 0;

    return {
      avgDurationSec: avgSec,
      formattedAvgDuration,
      longChatsCount: longCount,
      mediumChatsCount: mediumCount,
      shortChatsCount: shortCount,
      longChatPercentage: Math.round((longCount / totalCount) * 100),
      mediumChatPercentage: Math.round((mediumCount / totalCount) * 100),
      shortChatPercentage: Math.round((shortCount / totalCount) * 100),
      longChatConversionRate,
      shortChatConversionRate,
    };
  }, [sessions]);

  // Filtered sessions based on search & category filter
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Category filter
      if (selectedFilter === "converted" && s.status !== "converted") return false;
      if (selectedFilter === "long" && s.chatDepth !== "long") return false;
      if (selectedFilter === "recommended" && s.recommendedProductsCount === 0) return false;
      if (selectedFilter === "short" && s.chatDepth !== "short") return false;

      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchSessionId = s.sessionId.toLowerCase().includes(q);
      const matchEvent = s.events.some(
        (ev) =>
          (ev.productName && ev.productName.toLowerCase().includes(q)) ||
          (ev.selectedColor && ev.selectedColor.toLowerCase().includes(q)) ||
          (ev.selectedSize && ev.selectedSize.toLowerCase().includes(q)) ||
          (ev.messageText && ev.messageText.toLowerCase().includes(q))
      );
      return matchSessionId || matchEvent;
    });
  }, [sessions, selectedFilter, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Spinner size="lg" />
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">
          جارٍ تحليل جلسات الشات بوت والذكاء الاصطناعي...
        </p>
      </div>
    );
  }

  const events = data?.events || [];
  const filteredRawEvents = events.filter((ev) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (ev.productName && ev.productName.toLowerCase().includes(q)) ||
      (ev.selectedColor && ev.selectedColor.toLowerCase().includes(q)) ||
      (ev.selectedSize && ev.selectedSize.toLowerCase().includes(q)) ||
      ev.type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12 font-sans text-right" dir="rtl">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-300/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
            <Bot size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              <span>تحليلات شات بوت المبيعات وجلسات AI</span>
              <Sparkles size={18} className="text-amber-400 animate-pulse" />
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              تحليل شامل لمحادثات الزوار، مدة كل شات، الشات الطويل، والتوصيات المحولة لمبيعات 🚀
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-2xl text-zinc-400">
          <RefreshCw size={14} className="text-emerald-400 animate-spin" />
          <span>تحديث مباشر لحظي (Realtime)</span>
        </div>
      </div>

      {/* ── Top KPI Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Conversations */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-bold">إجمالي المحادثات</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-white font-mono">
              {sessions.length}
            </span>
            <span className="text-[11px] text-zinc-500 block mt-1">جلسة محادثة أونلاين</span>
          </div>
        </motion.div>

        {/* 2. Average Chat Duration */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-bold">متوسط مدة المحادثة</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-black text-purple-300 font-mono">
              {aggregateMetrics.formattedAvgDuration}
            </span>
            <span className="text-[11px] text-zinc-500 block mt-1">معدل البقاء للشات الواحد</span>
          </div>
        </motion.div>

        {/* 3. Long Chat Ratio */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-zinc-900/80 border border-amber-500/20 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 font-bold">معدل الشات الطويل</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-amber-300 font-mono">
              {aggregateMetrics.longChatPercentage}%
            </span>
            <span className="text-[11px] text-amber-500/80 block mt-1 font-bold">
              {aggregateMetrics.longChatsCount} محادثة عميقة وتفاعلية
            </span>
          </div>
        </motion.div>

        {/* 4. Cart Adds from Chat */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-bold">إضافات السلة والتحويل</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShoppingCart size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {data?.totalCartAdds || 0}
            </span>
            <span className="text-[11px] text-emerald-500/80 block mt-1 font-bold">
              معدل التحويل: {data?.conversionRate || 0}%
            </span>
          </div>
        </motion.div>

        {/* 5. Generated Revenue */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-zinc-900/80 border border-amber-500/30 flex flex-col justify-between bg-gradient-to-tr from-amber-950/20 to-zinc-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-bold">المبيعات المقدرة</span>
            <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-amber-300 font-mono">
              {data?.estimatedRevenue || 0} ج.م
            </span>
            <span className="text-[11px] text-zinc-400 block mt-1">قيمة المنتجات المضافة</span>
          </div>
        </motion.div>
      </div>

      {/* ── Chat Depth & Duration Distribution Banner ── */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Timer className="text-amber-400" size={20} />
            <h3 className="text-sm font-black text-white">
              تحليل توزيع عمق ومدة المحادثات (Chat Depth & Duration Insights)
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono bg-zinc-950 px-3 py-1 rounded-xl border border-zinc-800">
            شات طويل: تحويل {aggregateMetrics.longChatConversionRate}% 🎯
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-zinc-950 rounded-full overflow-hidden flex p-0.5 border border-zinc-800">
            {aggregateMetrics.longChatPercentage > 0 && (
              <div
                style={{ width: `${aggregateMetrics.longChatPercentage}%` }}
                className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-500 relative group"
                title={`شات طويل: ${aggregateMetrics.longChatsCount} (${aggregateMetrics.longChatPercentage}%)`}
              />
            )}
            {aggregateMetrics.mediumChatPercentage > 0 && (
              <div
                style={{ width: `${aggregateMetrics.mediumChatPercentage}%` }}
                className="bg-purple-500 h-full rounded-full transition-all duration-500 relative group"
                title={`شات متوسط: ${aggregateMetrics.mediumChatsCount} (${aggregateMetrics.mediumChatPercentage}%)`}
              />
            )}
            {aggregateMetrics.shortChatPercentage > 0 && (
              <div
                style={{ width: `${aggregateMetrics.shortChatPercentage}%` }}
                className="bg-zinc-700 h-full rounded-full transition-all duration-500 relative group"
                title={`شات قصير: ${aggregateMetrics.shortChatsCount} (${aggregateMetrics.shortChatPercentage}%)`}
              />
            )}
          </div>

          {/* Legend Badges */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold pt-1">
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>🔥 شات طويل (3+ دقائق أو 5+ تفاعلات): {aggregateMetrics.longChatsCount} ({aggregateMetrics.longChatPercentage}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>⚡ شات متوسط (45ث - 3د دقائق): {aggregateMetrics.mediumChatsCount} ({aggregateMetrics.mediumChatPercentage}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
              <span>⏱️ شات قصير (تفاعل سريع): {aggregateMetrics.shortChatsCount} ({aggregateMetrics.shortChatPercentage}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Section: Navigation Tabs & Search ── */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab("sessions")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === "sessions"
                  ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <Layers size={15} />
              <span>جلسات المحادثات المجمعة ({sessions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("top_products")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === "top_products"
                  ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <Award size={15} />
              <span>الأكثر تحويلاً للمبيعات ({data?.topProducts.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("live_feed")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === "live_feed"
                  ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <ListFilter size={15} />
              <span>سجل الأحداث المباشر ({events.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute right-3.5 top-3 text-zinc-500" />
            <input
              type="text"
              placeholder="بحث بالجلسة، اسم المنتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/80"
            />
          </div>
        </div>

        {/* ── TAB 1: Grouped Sessions View ── */}
        {activeTab === "sessions" && (
          <div className="space-y-4">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500 font-bold flex items-center gap-1">
                <Filter size={13} /> تصفية الجلسات:
              </span>
              {[
                { id: "all", label: `الكل (${sessions.length})` },
                { id: "converted", label: `🛒 تم التحويل للسلة (${sessions.filter((s) => s.status === "converted").length})` },
                { id: "long", label: `🔥 شات طويل (${sessions.filter((s) => s.chatDepth === "long").length})` },
                { id: "recommended", label: `👕 توصيات منتجات (${sessions.filter((s) => s.recommendedProductsCount > 0).length})` },
                { id: "short", label: `⏱️ شات قصير (${sessions.filter((s) => s.chatDepth === "short").length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id as typeof selectedFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedFilter === f.id
                      ? "bg-zinc-800 border-amber-400 text-amber-300 shadow-sm"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Session Cards List */}
            {filteredSessions.length > 0 ? (
              <div className="space-y-4">
                {filteredSessions.map((session) => {
                  const isExpanded = expandedSessionId === session.sessionId;

                  return (
                    <motion.div
                      key={session.sessionId}
                      layout
                      className={`rounded-2xl border transition-all ${
                        session.status === "converted"
                          ? "bg-emerald-950/10 border-emerald-500/30"
                          : session.isLongChat
                          ? "bg-amber-950/10 border-amber-500/30"
                          : "bg-zinc-950 border-zinc-800"
                      }`}
                    >
                      {/* Session Header */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                              session.status === "converted"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : session.isLongChat
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {session.status === "converted" ? (
                              <ShoppingCart size={18} />
                            ) : (
                              <MessageSquare size={18} />
                            )}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-xs font-black text-white font-mono">
                                جلسة: {session.sessionId}
                              </h4>
                              <span className="text-[10px] text-zinc-500">
                                ({formatRelativeTime(session.endTime)})
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                              {/* Depth Badge */}
                              <span
                                className={`font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                  session.chatDepth === "long"
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : session.chatDepth === "medium"
                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                    : "bg-zinc-800 text-zinc-400"
                                }`}
                              >
                                {session.chatDepth === "long" ? (
                                  <>
                                    <Flame size={12} /> شات طويل (عميق)
                                  </>
                                ) : session.chatDepth === "medium" ? (
                                  <>
                                    <Zap size={12} /> شات متوسط
                                  </>
                                ) : (
                                  <>
                                    <Timer size={12} /> شات قصير
                                  </>
                                )}
                              </span>

                              {/* Duration Badge */}
                              <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Clock size={11} className="text-zinc-500" />
                                مدة الشات: {session.formattedDuration}
                              </span>

                              {/* Interaction Count */}
                              <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded-full">
                                {session.interactionCount} تفاعلات
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status & Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-zinc-800 pt-3 sm:pt-0">
                          <div className="text-right sm:text-left">
                            {session.status === "converted" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                                <CheckCircle2 size={13} />
                                تم التحويل للسلة (+{session.totalCartValue} ج.م)
                              </span>
                            ) : session.status === "recommended" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                                <Shirt size={13} />
                                {session.recommendedProductsCount} توصية منتج
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-zinc-500 bg-zinc-900 px-3 py-1 rounded-xl border border-zinc-800">
                                استفسار وتصفح
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => setExpandedSessionId(isExpanded ? null : session.sessionId)}
                            className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 px-3 py-1.5 rounded-xl transition-all"
                          >
                            <span>{isExpanded ? "إغلاق التفاصيل" : "عرض التايم لاين"}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Session Timeline Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-zinc-800/80 bg-zinc-950/80 p-4 sm:p-5 rounded-b-2xl space-y-3"
                          >
                            <h5 className="text-xs font-black text-zinc-300 flex items-center gap-1.5">
                              <Layers size={14} className="text-amber-400" />
                              <span>التايم لاين الزمني لأحداث ورسائل الجلسة:</span>
                            </h5>

                            <div className="space-y-2 relative before:absolute before:right-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800 pr-8">
                              {session.events.map((ev, idx) => {
                                const isAddToCart = ev.type === "add_to_cart_click";
                                const isRecommendation = ev.type === "product_recommended";
                                const isUserMsg = ev.type === "user_message";

                                return (
                                  <div key={ev.id || idx} className="relative flex items-start justify-between gap-3 text-xs">
                                    {/* Circle dot on timeline */}
                                    <span
                                      className={`absolute -right-8 top-1 w-3.5 h-3.5 rounded-full border-2 border-zinc-950 ${
                                        isAddToCart
                                          ? "bg-emerald-500"
                                          : isRecommendation
                                          ? "bg-amber-500"
                                          : isUserMsg
                                          ? "bg-blue-500"
                                          : "bg-zinc-600"
                                      }`}
                                    />

                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                            isAddToCart
                                              ? "bg-emerald-500/20 text-emerald-300"
                                              : isRecommendation
                                              ? "bg-amber-500/20 text-amber-300"
                                              : isUserMsg
                                              ? "bg-blue-500/20 text-blue-300"
                                              : "bg-zinc-800 text-zinc-400"
                                          }`}
                                        >
                                          {isAddToCart
                                            ? "إضافة إلى السلة"
                                            : isRecommendation
                                            ? "توصية منتج"
                                            : isUserMsg
                                            ? "رسالة مستخدم"
                                            : "بدء محادثة"}
                                        </span>

                                        <span className="text-[10px] text-zinc-500 font-mono">
                                          {formatRelativeTime(ev.timestamp)}
                                        </span>
                                      </div>

                                      {ev.messageText && (
                                        <p className="text-xs text-zinc-200 mt-1 font-medium bg-zinc-900/90 p-2 rounded-xl border border-zinc-800/80 inline-block">
                                          💬 &ldquo;{ev.messageText}&rdquo;
                                        </p>
                                      )}

                                      {ev.productName && (
                                        <p className="text-xs font-bold text-white mt-1">
                                          {ev.productName}{" "}
                                          {ev.selectedColor && (
                                            <span className="text-[11px] font-normal text-zinc-400">
                                              (لون: {ev.selectedColor} | مقاس: {ev.selectedSize})
                                            </span>
                                          )}
                                        </p>
                                      )}
                                    </div>

                                    {ev.price ? (
                                      <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                                        +{ev.price} ج.م
                                      </span>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-zinc-500 text-xs">
                لا توجد جلسات محادثة مطابقة للبحث حالياً.
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: Top Conversion Products ── */}
        {activeTab === "top_products" && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Award size={18} className="text-amber-400" />
              <span>أكثر المنتجات تحويلاً للمبيعات عبر الشات</span>
            </h3>

            {data?.topProducts && data.topProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.topProducts.map((prod, idx) => (
                  <div
                    key={prod.productId + idx}
                    className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 text-sm font-bold flex items-center justify-center font-mono border border-amber-400/20">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-white">{prod.name}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono">ID: {prod.productId}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-mono">
                      {prod.count} مرات إضافة للسلة
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-zinc-500 text-xs">
                لم يتم تسجيل إضافات للسلة عبر الشات بعد.
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: Raw Live Events Stream ── */}
        {activeTab === "live_feed" && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4">
              <ListFilter size={18} className="text-amber-400" />
              <span>السجل اللحظي لجميع التفاعلات المنفردة</span>
            </h3>

            {filteredRawEvents.length > 0 ? (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredRawEvents.map((ev, idx) => {
                  const isAddToCart = ev.type === "add_to_cart_click";
                  const isRecommendation = ev.type === "product_recommended";

                  return (
                    <div
                      key={ev.id || idx}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                        isAddToCart
                          ? "bg-emerald-950/20 border-emerald-500/30"
                          : isRecommendation
                          ? "bg-amber-950/20 border-amber-500/30"
                          : "bg-zinc-950 border-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isAddToCart
                              ? "bg-emerald-500/20 text-emerald-400"
                              : isRecommendation
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {isAddToCart ? (
                            <ShoppingCart size={16} />
                          ) : isRecommendation ? (
                            <Shirt size={16} />
                          ) : (
                            <MessageCircle size={16} />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                isAddToCart
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : isRecommendation
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-zinc-800 text-zinc-300"
                              }`}
                            >
                              {isAddToCart
                                ? "إضافة إلى السلة"
                                : isRecommendation
                                ? "توصية منتج"
                                : ev.type === "user_message"
                                ? "رسالة مستخدم"
                                : "بدء محادثة"}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              جلسة: {ev.sessionId?.substring(0, 16)}
                            </span>
                          </div>

                          {ev.messageText && (
                            <p className="text-xs text-zinc-300 mt-1 font-medium">
                              💬 &ldquo;{ev.messageText}&rdquo;
                            </p>
                          )}

                          {ev.productName && (
                            <p className="text-xs font-bold text-white mt-1">
                              {ev.productName}{" "}
                              {ev.selectedColor && (
                                <span className="text-[11px] font-normal text-zinc-400">
                                  (لون: {ev.selectedColor} | مقاس: {ev.selectedSize})
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-left font-mono">
                        {ev.price ? (
                          <span className="text-xs font-extrabold text-emerald-400 block">
                            +{ev.price} ج.م
                          </span>
                        ) : null}
                        <span className="text-[10px] text-zinc-500 block">
                          {formatRelativeTime(ev.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-zinc-500 text-xs">
                لا توجد أحداث مطابقة للبحث حالياً.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
