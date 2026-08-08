"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Activity,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Clock,
  Search,
  RefreshCw,
  TrendingUp,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  subscribeToVisitorSessions,
  type VisitorAnalyticsSummary,
  type VisitorSession,
} from "@/lib/firebase/firestore";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/features/auth/AuthProvider";

export default function AdminAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<VisitorAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "live" | "inactive">("all");

  useEffect(() => {
    if (authLoading || !user) return;

    const unsubscribe = subscribeToVisitorSessions((summary) => {
      setData(summary);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const formatRelativeTime = (timestamp: any): { label: string; isLive: boolean } => {
    if (!timestamp) return { label: "غير معروف", isLive: false };
    let ms = 0;
    if (timestamp?.toMillis) ms = timestamp.toMillis();
    else if (timestamp?.seconds) ms = timestamp.seconds * 1000;
    else if (timestamp instanceof Date) ms = timestamp.getTime();

    if (!ms) return { label: "غير معروف", isLive: false };

    const diffSec = Math.floor((Date.now() - ms) / 1000);
    const isLive = diffSec <= 300; // 5 minutes

    if (diffSec < 15) return { label: "الآن", isLive: true };
    if (diffSec < 60) return { label: `منذ ${diffSec} ثانية`, isLive };
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return { label: `منذ ${diffMin} دقيقة`, isLive };
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return { label: `منذ ${diffHours} ساعة`, isLive: false };
    const diffDays = Math.floor(diffHours / 24);
    return { label: `منذ ${diffDays} يوم`, isLive: false };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Spinner size="lg" />
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">
          جارٍ تحميل تحليلات الزوار المباشرة...
        </p>
      </div>
    );
  }

  const sessions = data?.sessions || [];

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    const { isLive } = formatRelativeTime(s.lastActive);
    if (activeFilter === "live" && !isLive) return false;
    if (activeFilter === "inactive" && isLive) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.visitorId.toLowerCase().includes(q) ||
      s.sessionId.toLowerCase().includes(q) ||
      s.currentPage.toLowerCase().includes(q) ||
      s.browser.toLowerCase().includes(q) ||
      s.device.toLowerCase().includes(q)
    );
  });

  const totalDev =
    (data?.deviceBreakdown.desktop || 0) +
    (data?.deviceBreakdown.mobile || 0) +
    (data?.deviceBreakdown.tablet || 0) || 1;

  const desktopPct = Math.round(((data?.deviceBreakdown.desktop || 0) / totalDev) * 100);
  const mobilePct = Math.round(((data?.deviceBreakdown.mobile || 0) / totalDev) * 100);
  const tabletPct = Math.round(((data?.deviceBreakdown.tablet || 0) / totalDev) * 100);

  const maxDailyCount = Math.max(...(data?.dailyTrend.map((d) => d.count) || [1]), 1);

  return (
    <div className="space-y-8 pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              تحليلات وزوار الموقع
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              مباشر الآن
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500">
            متابعة دقيقة للأشخاص المتواجدين في الموقع حالياً، زوار اليوم، وسجل الحركة بالكامل.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 bg-zinc-50 px-4 py-2.5 rounded-xl border border-zinc-200/80">
          <RefreshCw size={14} className="animate-spin text-zinc-400" />
          <span>تحديث تلقائي مستمر</span>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Active Now */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white p-6 rounded-2xl shadow-xl border border-zinc-800"
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase flex items-center gap-1.5">
              <Activity size={15} />
              متواجدون في الموقع حالياً
            </span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              {data?.liveCount ?? 0}
            </h2>
            <span className="text-xs text-emerald-400 font-medium">شخص الآن</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-medium">
            يتصفحون المتجر خلال الـ 5 دقائق الأخيرة
          </p>
        </motion.div>

        {/* Card 2: Today's Visitors */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              زوار اليوم
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
            {data?.todayCount ?? 0}
          </h2>
          <p className="text-[11px] text-zinc-400 mt-2 font-medium">
            عدد الجلسات الفريدة التي زارت الموقع اليوم
          </p>
        </motion.div>

        {/* Card 3: Total Visitors */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              إجمالي الزوار الكلي
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Globe size={18} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
            {data?.totalVisitors ?? 0}
          </h2>
          <p className="text-[11px] text-zinc-400 mt-2 font-medium">
            مجموع الجلسات المسجلة بالكامل
          </p>
        </motion.div>

        {/* Card 4: Total Page Views */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              إجمالي مشاهدات الصفحات
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Eye size={18} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
            {data?.totalPageViews ?? 0}
          </h2>
          <p className="text-[11px] text-zinc-400 mt-2 font-medium">
            مجموع التصفحات والتنقلات داخل المتجر
          </p>
        </motion.div>
      </div>

      {/* Visual Analytics Charts & Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trend Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-zinc-700" />
                حركة الزوار خلال الأيام الماضية
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">عدد الزوار يومياً</p>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-zinc-100">
            {data?.dailyTrend.map((item, idx) => {
              const heightPct = Math.max(Math.round((item.count / maxDailyCount) * 100), 8);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[10px] font-bold text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[36px] bg-zinc-900 rounded-t-lg group-hover:bg-amber-500 transition-all duration-300 relative"
                  ></div>
                  <span className="text-[10px] font-medium text-zinc-500 truncate max-w-full">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device Breakdown (1 column) */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Layers size={18} className="text-zinc-700" />
              توزيع نوع الأجهزة
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">نسبة تصفح الجوال والمكتب</p>
          </div>

          <div className="space-y-4">
            {/* Desktop */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5 text-zinc-700">
                <span className="flex items-center gap-1.5">
                  <Monitor size={14} className="text-zinc-500" /> كمبيوتر (Desktop)
                </span>
                <span>{desktopPct}% ({data?.deviceBreakdown.desktop || 0})</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-900 rounded-full"
                  style={{ width: `${desktopPct}%` }}
                ></div>
              </div>
            </div>

            {/* Mobile */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5 text-zinc-700">
                <span className="flex items-center gap-1.5">
                  <Smartphone size={14} className="text-zinc-500" /> هاتف (Mobile)
                </span>
                <span>{mobilePct}% ({data?.deviceBreakdown.mobile || 0})</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${mobilePct}%` }}
                ></div>
              </div>
            </div>

            {/* Tablet */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5 text-zinc-700">
                <span className="flex items-center gap-1.5">
                  <Tablet size={14} className="text-zinc-500" /> تابلت (Tablet)
                </span>
                <span>{tabletPct}% ({data?.deviceBreakdown.tablet || 0})</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${tabletPct}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Top pages list */}
          <div className="pt-4 border-t border-zinc-100">
            <h4 className="text-xs font-bold text-zinc-900 mb-3">أكثر الصفحات مشاهدة</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {data?.topPages.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-zinc-50">
                  <span className="font-mono text-zinc-700 dir-ltr text-right truncate max-w-[180px]">
                    {p.path}
                  </span>
                  <span className="font-bold text-zinc-900 px-2 py-0.5 bg-zinc-100 rounded">
                    {p.count} مشاهدة
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Live & Historical Visitors Log Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-zinc-900">سجل الزوار المباشر والجلسات</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              قائمة تفصيلية بكافة الأشخاص المتواجدين حالياً والأنشطة الأخيرة
            </p>
          </div>

          {/* Search & Filter bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Filter buttons */}
            <div className="flex bg-zinc-100 p-1 rounded-xl text-xs font-bold text-zinc-600">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeFilter === "all" ? "bg-white text-zinc-900 shadow-sm" : "hover:text-zinc-900"
                }`}
              >
                الكل ({sessions.length})
              </button>
              <button
                onClick={() => setActiveFilter("live")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  activeFilter === "live" ? "bg-white text-emerald-700 shadow-sm" : "hover:text-zinc-900"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                نشطون الآن ({data?.liveCount ?? 0})
              </button>
              <button
                onClick={() => setActiveFilter("inactive")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeFilter === "inactive" ? "bg-white text-zinc-900 shadow-sm" : "hover:text-zinc-900"
                }`}
              >
                غادروا
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="بحث بالصفحة، الجهاز..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 pl-3 pr-9 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-100">
          <table className="w-full text-right text-xs">
            <thead className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-100">
              <tr>
                <th className="py-3 px-4">حالة التواجد</th>
                <th className="py-3 px-4">معرف الجلسة</th>
                <th className="py-3 px-4">الصفحة الحالية / الأخيرة</th>
                <th className="py-3 px-4">الجهاز والملف</th>
                <th className="py-3 px-4">التنقلات</th>
                <th className="py-3 px-4">آخر نشاط</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-400 font-medium">
                    لا يوجد جلسات زوار تطابق البحث حالياً
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => {
                  const { label, isLive } = formatRelativeTime(session.lastActive);
                  const isMobile = session.device === "Mobile";
                  const isTablet = session.device === "Tablet";

                  return (
                    <tr key={session.id} className="hover:bg-zinc-50/70 transition-colors">
                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            نشط الآن
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-500">
                            <span className="w-2 h-2 rounded-full bg-zinc-300"></span>
                            غير نشط
                          </span>
                        )}
                      </td>

                      {/* Session ID */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500">
                        {session.sessionId.substring(0, 16)}...
                      </td>

                      {/* Current Page */}
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dir-ltr text-right">
                        <span className="inline-block bg-zinc-100 px-2 py-1 rounded font-mono text-[11px] text-zinc-800 border border-zinc-200/60 max-w-[220px] truncate">
                          {session.currentPage}
                        </span>
                      </td>

                      {/* Device & Browser */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {isMobile ? (
                            <Smartphone size={14} className="text-amber-500" />
                          ) : isTablet ? (
                            <Tablet size={14} className="text-blue-500" />
                          ) : (
                            <Monitor size={14} className="text-zinc-700" />
                          )}
                          <span className="font-semibold text-zinc-900">{session.device}</span>
                          <span className="text-zinc-400 text-[10px]">({session.browser})</span>
                        </div>
                      </td>

                      {/* Pageviews */}
                      <td className="py-3.5 px-4 font-bold text-zinc-700">
                        {session.pageViews} صفحة
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-4 text-zinc-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-zinc-400" />
                          <span>{label}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
