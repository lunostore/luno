"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Activity,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  Search,
  RefreshCw,
  TrendingUp,
  Layers,
  Megaphone,
  Copy,
  Check,
  Calendar,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  ShoppingCart,
  ShoppingBag,
  X,
  Plus,
} from "lucide-react";
import {
  subscribeToVisitorSessions,
  getProducts,
  type VisitorAnalyticsSummary,
} from "@/lib/firebase/firestore";
import type { Product } from "@/types/product";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/features/auth/AuthProvider";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

type DatePreset = "all" | "today" | "yesterday" | "7days" | "30days" | "month" | "custom";
type TabType = "overview" | "campaigns" | "abandonment";

export default function AdminAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<VisitorAnalyticsSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "live" | "inactive" | "abandoned" | "campaign">("all");
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string | null>(null);

  // Date Range State
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Campaign URL Builder State
  const [showUrlBuilder, setShowUrlBuilder] = useState(false);
  const [builderProductId, setBuilderProductId] = useState<string>("");
  const [builderCampaignName, setBuilderCampaignName] = useState<string>("");
  const [builderSource, setBuilderSource] = useState<string>("TikTok");
  const [builderMedium, setBuilderMedium] = useState<string>("cpc");
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Fetch initial visitor sessions and products list
  useEffect(() => {
    if (authLoading || !user) return;

    const unsubscribe = subscribeToVisitorSessions((summary) => {
      setData(summary);
      setLoading(false);
    });

    getProducts()
      .then((prods) => {
        setProducts(prods);
        if (prods.length > 0) {
          setBuilderProductId(prods[0].id);
        }
      })
      .catch(console.error);

    return () => unsubscribe();
  }, [user, authLoading]);

  // Handle Preset Date Selection
  const applyDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
      return;
    }

    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
      return;
    }

    if (preset === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      setStartDate(yStr);
      setEndDate(yStr);
      return;
    }

    if (preset === "7days") {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 6);
      setStartDate(past7.toISOString().slice(0, 10));
      setEndDate(todayStr);
      return;
    }

    if (preset === "30days") {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 29);
      setStartDate(past30.toISOString().slice(0, 10));
      setEndDate(todayStr);
      return;
    }

    if (preset === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(todayStr);
      return;
    }
  };

  const formatRelativeTime = (timestamp: unknown): { label: string; isLive: boolean } => {
    let ms = 0;
    const ts = timestamp as Record<string, unknown> & { toMillis?: () => number; seconds?: number };
    if (typeof ts?.toMillis === "function") ms = ts.toMillis();
    else if (ts?.seconds) ms = ts.seconds * 1000;
    else if (timestamp instanceof Date) ms = timestamp.getTime();
    else if (typeof timestamp === "number" && timestamp > 0) ms = timestamp;

    if (!ms) ms = Date.now();

    const diffSec = Math.floor((Date.now() - ms) / 1000);
    const isLive = diffSec <= 300; // 5 minutes

    if (diffSec <= 15) return { label: "الآن", isLive: true };
    if (diffSec < 60) return { label: `منذ ${diffSec} ثانية`, isLive };
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return { label: `منذ ${diffMin} دقيقة`, isLive };
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return { label: `منذ ${diffHours} ساعة`, isLive: false };
    const diffDays = Math.floor(diffHours / 24);
    return { label: `منذ ${diffDays} يوم`, isLive: false };
  };

  // Generated Campaign Link
  const generatedCampaignUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    const selectedProd = products.find((p) => p.id === builderProductId);
    const prodParam = selectedProd ? selectedProd.id : builderProductId;
    const cleanCamp = builderCampaignName.trim().replace(/\s+/g, "_") || "campaign";
    const cleanSource = builderSource.trim().toLowerCase().replace(/\s+/g, "_") || "social";
    const cleanMedium = builderMedium.trim().toLowerCase() || "ad";

    return `${origin}/products?id=${encodeURIComponent(prodParam)}&utm_campaign=${encodeURIComponent(
      cleanCamp
    )}&utm_source=${encodeURIComponent(cleanSource)}&utm_medium=${encodeURIComponent(cleanMedium)}`;
  }, [products, builderProductId, builderCampaignName, builderSource, builderMedium]);

  const copyGeneratedUrl = () => {
    if (!generatedCampaignUrl) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(generatedCampaignUrl);
    }
    setCopiedUrl(true);
    toast.success("تم نسخ رابط الحملة الإعلانية بنجاح!");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Filter sessions by Date Range
  const sessionsInDateRange = useMemo(() => {
    const rawSessions = data?.sessions || [];
    if (!startDate && !endDate) return rawSessions;

    return rawSessions.filter((s) => {
      const dKey = s.dateKey;
      if (!dKey) return true;
      if (startDate && dKey < startDate) return false;
      if (endDate && dKey > endDate) return false;
      return true;
    });
  }, [data?.sessions, startDate, endDate]);

  // Filtered Sessions for Table Display
  const filteredSessions = useMemo(() => {
    return sessionsInDateRange.filter((s) => {
      const { isLive } = formatRelativeTime(s.lastActive);
      if (activeFilter === "live" && !isLive) return false;
      if (activeFilter === "inactive" && isLive) return false;

      // Abandoned filter: reached checkout (rank >= 4) but did NOT complete order (rank < 5)
      if (activeFilter === "abandoned") {
        const isCompleted = s.maxStageRank >= 5 || s.maxStage === "order_success";
        if (s.maxStageRank < 4 || isCompleted) return false;
      }

      // Campaign filter
      if (activeFilter === "campaign" && !s.isFromCampaign) return false;

      if (selectedCampaignFilter && s.campaignName !== selectedCampaignFilter) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.visitorId.toLowerCase().includes(q) ||
        s.sessionId.toLowerCase().includes(q) ||
        s.currentPage.toLowerCase().includes(q) ||
        s.maxStageLabel.toLowerCase().includes(q) ||
        (s.campaignName && s.campaignName.toLowerCase().includes(q)) ||
        (s.campaignSource && s.campaignSource.toLowerCase().includes(q)) ||
        s.browser.toLowerCase().includes(q) ||
        s.device.toLowerCase().includes(q)
      );
    });
  }, [sessionsInDateRange, activeFilter, selectedCampaignFilter, searchQuery]);

  // Aggregated Stats for Selected Date Range
  const dateRangeStats = useMemo(() => {
    let pageViews = 0;
    let reachedCheckout = 0;
    let completedOrders = 0;
    let campaignVisitors = 0;

    sessionsInDateRange.forEach((s) => {
      pageViews += s.pageViews || 1;
      if (s.maxStageRank >= 4) reachedCheckout++;
      if (s.maxStageRank >= 5 || s.maxStage === "order_success") completedOrders++;
      if (s.isFromCampaign) campaignVisitors++;
    });

    const abandoned = Math.max(0, reachedCheckout - completedOrders);
    const dropRate = reachedCheckout > 0 ? Math.round((abandoned / reachedCheckout) * 100) : 0;

    return {
      totalVisitors: sessionsInDateRange.length,
      pageViews,
      reachedCheckout,
      completedOrders,
      abandoned,
      dropRate,
      campaignVisitors,
    };
  }, [sessionsInDateRange]);

  // Device Breakdown in range
  const deviceStats = useMemo(() => {
    const counts = { desktop: 0, mobile: 0, tablet: 0 };
    sessionsInDateRange.forEach((s) => {
      const dev = (s.device || "Desktop").toLowerCase();
      if (dev.includes("mobile")) counts.mobile++;
      else if (dev.includes("tablet")) counts.tablet++;
      else counts.desktop++;
    });
    const total = counts.desktop + counts.mobile + counts.tablet || 1;
    return {
      counts,
      desktopPct: Math.round((counts.desktop / total) * 100),
      mobilePct: Math.round((counts.mobile / total) * 100),
      tabletPct: Math.round((counts.tablet / total) * 100),
    };
  }, [sessionsInDateRange]);

  // Daily Trend computed for selected date range
  const dailyTrendInRange = useMemo(() => {
    if (!sessionsInDateRange || sessionsInDateRange.length === 0) {
      return [];
    }

    const countMap: Record<string, number> = {};
    sessionsInDateRange.forEach((s) => {
      const k = s.dateKey;
      if (k) {
        countMap[k] = (countMap[k] || 0) + 1;
      }
    });

    const sortedDates = Object.keys(countMap).sort();
    if (sortedDates.length === 0) return [];

    return sortedDates.map((date) => {
      const dObj = new Date(date);
      const isInvalid = isNaN(dObj.getTime());
      const dayName = isInvalid
        ? date
        : dObj.toLocaleDateString("ar-EG", { weekday: "short" });
      const dayNum = isInvalid
        ? ""
        : dObj.toLocaleDateString("ar-EG", { day: "numeric", month: "numeric" });
      const fullDate = isInvalid
        ? date
        : dObj.toLocaleDateString("ar-EG", { dateStyle: "full" });

      return {
        date,
        dayName,
        dayNum,
        label: `${dayName} ${dayNum}`.trim(),
        fullDate,
        count: countMap[date] || 0,
      };
    });
  }, [sessionsInDateRange]);

  const maxDailyCount = useMemo(() => {
    if (!dailyTrendInRange || dailyTrendInRange.length === 0) return 1;
    return Math.max(...dailyTrendInRange.map((d) => d.count), 1);
  }, [dailyTrendInRange]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Spinner size="lg" />
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">
          جارٍ تحميل تحليلات الزوار ورادار الحملات الإعلانية...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16" dir="rtl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              تحليلات الزوار ورادار الحملات الإعلانية
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              {data?.liveCount ?? 0} متواجد الآن
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500">
            متابعة دقيقة لمسار الزوار، أقصى مرحلة وصلوا إليها (الشيك أوت)، وتتبع الحملات الترويجية بالكامل.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowUrlBuilder(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Megaphone size={15} />
            <span>إنشاء رابط حملة إعلانية</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 bg-zinc-50 px-3.5 py-2.5 rounded-xl border border-zinc-200/80">
            <RefreshCw size={13} className="animate-spin text-zinc-400" />
            <span className="hidden sm:inline">تحديث تلقائي</span>
          </div>
        </div>
      </div>

      {/* ── DATE RANGE FILTER BAR ─────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold">
              <Calendar size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-900">نطاق الفلترة بالتاريخ</span>
              <p className="text-[11px] text-zinc-400">تحديد فترة زمنية معينة لمعرفة عدد الزوار والمشاهدات</p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 bg-zinc-50 p-1 rounded-xl border border-zinc-200/60 text-xs font-bold">
            <button
              onClick={() => applyDatePreset("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                datePreset === "all" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              كل الوقت
            </button>
            <button
              onClick={() => applyDatePreset("today")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                datePreset === "today" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => applyDatePreset("yesterday")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                datePreset === "yesterday" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              أمس
            </button>
            <button
              onClick={() => applyDatePreset("7days")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                datePreset === "7days" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => applyDatePreset("30days")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                datePreset === "30days" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              آخر 30 يوماً
            </button>
            <button
              onClick={() => applyDatePreset("month")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                datePreset === "month" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              هذا الشهر
            </button>
          </div>
        </div>

        {/* Custom Date Pickers */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-100">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-zinc-500">من تاريخ:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("custom");
              }}
              className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-800 font-medium focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-zinc-500">إلى تاريخ:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset("custom");
              }}
              className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-800 font-medium focus:outline-none focus:border-zinc-900"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => applyDatePreset("all")}
              className="text-xs text-zinc-500 hover:text-red-600 font-bold flex items-center gap-1 transition-colors pr-2"
            >
              <X size={14} />
              <span>إلغاء الفلترة</span>
            </button>
          )}

          {/* Active Period Feedback Chip */}
          <div className="mr-auto inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-xl text-xs font-bold border border-blue-200/60">
            <Users size={14} className="text-blue-600" />
            <span>
              {startDate || endDate
                ? `تم تسجيل ${dateRangeStats.totalVisitors} زائر في الفترة المحددة`
                : `إجمالي المسجلين: ${data?.totalVisitors ?? 0} زائر`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Metric Cards Grid (Reflects Active Date Range) */}
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
              متواجدون الآن
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

        {/* Card 2: Filtered Visitors */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              {startDate || endDate ? "زوار الفترة المحددة" : "زوار اليوم"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
            {startDate || endDate ? dateRangeStats.totalVisitors : data?.todayCount ?? 0}
          </h2>
          <p className="text-[11px] text-zinc-400 mt-2 font-medium">
            {startDate || endDate ? `جلسات الفترة (${startDate || "البداية"} إلى ${endDate || "الآن"})` : "عدد الجلسات الفريدة لليوم"}
          </p>
        </motion.div>

        {/* Card 3: Checkout Reached & Abandoned */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm cursor-pointer hover:border-amber-300 transition-all"
          onClick={() => {
            setActiveFilter("abandoned");
            toast.info("تمت فلترة الزوار لعرض من وصلوا للشيك أوت ولم يطلبوا");
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              وصلوا للشيك أوت
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShoppingCart size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
              {dateRangeStats.reachedCheckout}
            </h2>
            {dateRangeStats.abandoned > 0 && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                {dateRangeStats.abandoned} لم يطلبوا
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-medium">
            أقصى مرحلة لهم كانت صفحة الدفع (انقر لعزلهم)
          </p>
        </motion.div>

        {/* Card 4: Ad Campaign Visitors */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm cursor-pointer hover:border-blue-300 transition-all"
          onClick={() => {
            setActiveTab("campaigns");
            toast.info("الانتقال لجدول تحليلات الحملات الإعلانية");
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              زوار الحملات الإعلانية
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Megaphone size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
              {dateRangeStats.campaignVisitors}
            </h2>
            <span className="text-xs text-blue-600 font-bold">
              ({data?.campaigns.length || 0} حملة)
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-medium">
            دخلوا عبر إعلانات تيك توك، فيسبوك، إنستجرام
          </p>
        </motion.div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "overview"
              ? "bg-zinc-900 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 bg-zinc-100/80"
          }`}
        >
          <Users size={15} />
          <span>سجل الزوار المباشر وقمع الشراء</span>
        </button>

        <button
          onClick={() => setActiveTab("campaigns")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "campaigns"
              ? "bg-zinc-900 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 bg-zinc-100/80"
          }`}
        >
          <Megaphone size={15} />
          <span>متابعة الحملات الإعلانية ({data?.campaigns.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("abandonment")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "abandonment"
              ? "bg-zinc-900 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 bg-zinc-100/80"
          }`}
        >
          <ShoppingCart size={15} />
          <span>تحليل التخلي عن الشيك أوت</span>
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & FUNNEL ─────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Visual Analytics Charts & Device Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start min-w-0">
            {/* Daily Trend Chart (2 cols) */}
            <div className="lg:col-span-2 min-w-0 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <TrendingUp size={18} className="text-zinc-700" />
                    حركة الزوار اليومية
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">عدد الزوار المسجلين لكل يوم في الفترة المحددة</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-lg">
                    {dailyTrendInRange.length} {dailyTrendInRange.length === 1 ? "يوم" : "أيام"}
                  </span>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200/60 px-3 py-1 rounded-lg">
                    {dateRangeStats.totalVisitors} زائر إجمالي
                  </span>
                </div>
              </div>

              {dailyTrendInRange.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-zinc-400 space-y-2">
                  <Calendar size={28} className="text-zinc-300" />
                  <p className="text-xs font-medium">لا توجد زيارات مسجلة في هذا النطاق الزمني</p>
                </div>
              ) : (
                <div className="w-full min-w-0 overflow-x-auto pb-2 pt-4">
                  {/* Subtle Grid Lines & Bars */}
                  <div className="relative h-48 min-w-[280px] w-full flex items-end justify-between gap-2 px-2 border-b border-zinc-200/70">
                    <div className="absolute inset-x-0 top-0 border-b border-dashed border-zinc-100 pointer-events-none"></div>
                    <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-zinc-100 pointer-events-none"></div>

                    {dailyTrendInRange.map((item, idx) => {
                      const heightPct = Math.max(Math.round((item.count / maxDailyCount) * 100), 10);
                      return (
                        <div
                          key={idx}
                          title={`${item.fullDate}: ${item.count} زائر`}
                          className="flex-1 min-w-[36px] max-w-[56px] flex flex-col items-center gap-1.5 group h-full justify-end relative z-10"
                        >
                          {/* Count Label */}
                          <span className="text-[10px] font-bold text-zinc-700 bg-zinc-100 group-hover:bg-amber-500 group-hover:text-black px-1.5 py-0.5 rounded transition-all duration-200 whitespace-nowrap">
                            {item.count}
                          </span>

                          {/* Bar */}
                          <div
                            style={{ height: `${heightPct}%` }}
                            className="w-full bg-zinc-900 group-hover:bg-amber-500 rounded-t-md transition-all duration-300 shadow-sm"
                          ></div>

                          {/* Clean 2-line Date Label */}
                          <div className="flex flex-col items-center leading-tight text-center">
                            <span className="text-[10px] font-bold text-zinc-700 whitespace-nowrap">
                              {item.dayName}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-mono whitespace-nowrap">
                              {item.dayNum}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Device Breakdown (1 col) */}
            <div className="lg:col-span-1 min-w-0 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6 overflow-hidden">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Layers size={18} className="text-zinc-700" />
                  توزيع الأجهزة في الفترة
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">نسبة تصفح الهواتف وأجهزة الكمبيوتر</p>
              </div>

              <div className="space-y-4">
                {/* Desktop */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5 text-zinc-700">
                    <span className="flex items-center gap-1.5">
                      <Monitor size={14} className="text-zinc-500" /> كمبيوتر (Desktop)
                    </span>
                    <span>{deviceStats.desktopPct}% ({deviceStats.counts.desktop})</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-900 rounded-full" style={{ width: `${deviceStats.desktopPct}%` }}></div>
                  </div>
                </div>

                {/* Mobile */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5 text-zinc-700">
                    <span className="flex items-center gap-1.5">
                      <Smartphone size={14} className="text-amber-500" /> هاتف (Mobile)
                    </span>
                    <span>{deviceStats.mobilePct}% ({deviceStats.counts.mobile})</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${deviceStats.mobilePct}%` }}></div>
                  </div>
                </div>

                {/* Tablet */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5 text-zinc-700">
                    <span className="flex items-center gap-1.5">
                      <Tablet size={14} className="text-blue-500" /> تابلت (Tablet)
                    </span>
                    <span>{deviceStats.tabletPct}% ({deviceStats.counts.tablet})</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${deviceStats.tabletPct}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Top Pages List */}
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

          {/* ── DETAILED LIVE & HISTORICAL VISITORS TABLE ─────────────── */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-zinc-900">سجل الزوار التفصيلي وأقصى المراحل</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  قائمة الزوار مع توضيح أقصى مرحلة وصل إليها كل شخص، والحملة الإعلانية التي جاء منها
                </p>
              </div>

              {/* Search & Filter bar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter buttons */}
                <div className="flex flex-wrap bg-zinc-100 p-1 rounded-xl text-xs font-bold text-zinc-600">
                  <button
                    onClick={() => {
                      setActiveFilter("all");
                      setSelectedCampaignFilter(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeFilter === "all" ? "bg-white text-zinc-900 shadow-sm" : "hover:text-zinc-900"
                    }`}
                  >
                    الكل ({sessionsInDateRange.length})
                  </button>
                  <button
                    onClick={() => {
                      setActiveFilter("live");
                      setSelectedCampaignFilter(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                      activeFilter === "live" ? "bg-white text-emerald-700 shadow-sm" : "hover:text-zinc-900"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    نشط الآن ({data?.liveCount ?? 0})
                  </button>
                  <button
                    onClick={() => {
                      setActiveFilter("abandoned");
                      setSelectedCampaignFilter(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                      activeFilter === "abandoned" ? "bg-white text-purple-700 shadow-sm" : "hover:text-zinc-900"
                    }`}
                  >
                    <ShoppingCart size={13} />
                    وصلوا للشيك أوت ولم يطلبوا ({dateRangeStats.abandoned})
                  </button>
                  <button
                    onClick={() => {
                      setActiveFilter("campaign");
                      setSelectedCampaignFilter(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                      activeFilter === "campaign" ? "bg-white text-blue-700 shadow-sm" : "hover:text-zinc-900"
                    }`}
                  >
                    <Megaphone size={13} />
                    من إعلانات ({dateRangeStats.campaignVisitors})
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="بحث بالحملة، المرحلة، الصفحة..."
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
                    <th className="py-3 px-4">أقصى مرحلة وصل إليها الزائر</th>
                    <th className="py-3 px-4">الحملة الإعلانية / المصدر</th>
                    <th className="py-3 px-4">الجهاز والملف</th>
                    <th className="py-3 px-4">التنقلات</th>
                    <th className="py-3 px-4">آخر نشاط</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-zinc-400 font-medium">
                        لا يوجد جلسات زوار تطابق البحث أو النطاق الزمني المحدد
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => {
                      const { label, isLive } = formatRelativeTime(session.lastActive);
                      const isMobile = session.device === "Mobile";
                      const isTablet = session.device === "Tablet";
                      const stageRank = session.maxStageRank || 1;

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

                          {/* Max Stage Reached (with smart visual badges) */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1">
                              {stageRank >= 5 || session.maxStage === "order_success" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300/80 w-fit">
                                  <CheckCircle2 size={13} className="text-emerald-700" />
                                  أتم الشراء بنجاح ✅
                                </span>
                              ) : stageRank >= 4 || session.maxStage === "checkout" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-900 border border-amber-300/80 w-fit">
                                  <AlertCircle size={13} className="text-amber-700" />
                                  وصل لصفحة الدفع (Checkout 🛒💳)
                                </span>
                              ) : stageRank >= 3 || session.maxStage === "cart" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200/80 w-fit">
                                  <ShoppingCart size={13} className="text-blue-600" />
                                  وصل لسلة المشتريات
                                </span>
                              ) : stageRank >= 2 || session.maxStage === "product" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 text-zinc-800 border border-zinc-200/80 w-fit">
                                  <ShoppingBag size={13} className="text-zinc-600" />
                                  مشاهدة منتج {session.maxStageProductName ? `(${session.maxStageProductName})` : ""}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-50 text-zinc-500 border border-zinc-200/60 w-fit">
                                  تصفح عام
                                </span>
                              )}

                              {/* Current Page Subtext */}
                              <span className="text-[10px] text-zinc-400 font-mono dir-ltr text-right truncate max-w-[220px]">
                                حالياً: {session.currentPage}
                              </span>
                            </div>
                          </td>

                          {/* Ad Campaign / Attribution */}
                          <td className="py-3.5 px-4">
                            {session.isFromCampaign && session.campaignName ? (
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/80 w-fit">
                                  <Megaphone size={12} className="text-indigo-600" />
                                  {session.campaignName}
                                </span>
                                <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                                  <span className="font-semibold text-zinc-600">{session.campaignSource || "Social"}</span>
                                  {session.campaignProductName && (
                                    <span className="text-zinc-500 truncate max-w-[140px]">
                                      • {session.campaignProductName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-zinc-400 font-medium">
                                تصفح مباشر / عادي
                              </span>
                            )}
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
      )}

      {/* ── TAB 2: AD CAMPAIGNS & TRACKER ────────────────────────────── */}
      {activeTab === "campaigns" && (
        <div className="space-y-8">
          {/* Top Banner & Quick Creator */}
          <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <Megaphone size={16} />
                نظام رادار الحملات الترويجية الذكي
              </span>
              <h3 className="text-xl font-black text-white">
                تتبع نقرات الإعلانات على كل منتج ومعدلات التحويل للشراء
              </h3>
              <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                أنشئ روابط مخصصة لإعلاناتك على TikTok, Instagram, Facebook أو Google وضعها في حملتك الممولة. سيسجل المتجر فورياً كل شخص ضغط على الإعلان، زار المنتج، أضافه للسلة أو أتم الشراء!
              </p>
            </div>

            <button
              onClick={() => setShowUrlBuilder(true)}
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-6 py-3 rounded-xl font-black text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer whitespace-nowrap"
            >
              <Plus size={16} />
              <span>توليد رابط إعلان جديد</span>
            </button>
          </div>

          {/* Campaigns Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
              <span className="text-xs text-zinc-400 font-bold block mb-1">إجمالي الحملات المسجلة</span>
              <h3 className="text-2xl font-black text-zinc-900">{data?.campaigns.length ?? 0} حملة</h3>
              <p className="text-[11px] text-zinc-400 mt-1">حملات نشطة تم استقبال زيارات منها</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
              <span className="text-xs text-zinc-400 font-bold block mb-1">نقرات وزيارات الإعلانات الفعلية</span>
              <h3 className="text-2xl font-black text-blue-600">
                {data?.campaigns.reduce((acc, c) => acc + c.totalVisits, 0) || 0} زيارة
              </h3>
              <p className="text-[11px] text-zinc-400 mt-1">زوار دخلوا مباشرة من روابط الحملات</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
              <span className="text-xs text-zinc-400 font-bold block mb-1">من وصلوا للشيك أوت من الإعلانات</span>
              <h3 className="text-2xl font-black text-purple-600">
                {data?.campaigns.reduce((acc, c) => acc + c.reachedCheckout, 0) || 0} شخص
              </h3>
              <p className="text-[11px] text-zinc-400 mt-1">وصلوا لصفحة الدفع من الإعلانات</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
              <span className="text-xs text-zinc-400 font-bold block mb-1">الطلبات المكتملة عبر الإعلانات</span>
              <h3 className="text-2xl font-black text-emerald-600">
                {data?.campaigns.reduce((acc, c) => acc + c.convertedOrders, 0) || 0} أوردر
              </h3>
              <p className="text-[11px] text-zinc-400 mt-1">مبيعات مؤكدة ناتجة عن الحملات الإعلانية</p>
            </div>
          </div>

          {/* Campaigns Detailed Table */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-zinc-900">جدول أداء الحملات الإعلانية للمنتجات</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  تفاصيل كل حملة، المنتج المستهدف، عدد الزيارات، والتحويل الفعلي للمبيعات
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-100">
              <table className="w-full text-right text-xs">
                <thead className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-100">
                  <tr>
                    <th className="py-3 px-4">اسم الحملة والمنصة</th>
                    <th className="py-3 px-4">المنتج المستهدف بالإعلان</th>
                    <th className="py-3 px-4">الزيارات الفعلية</th>
                    <th className="py-3 px-4">زوار فريدون</th>
                    <th className="py-3 px-4">وصلوا للشيك أوت</th>
                    <th className="py-3 px-4">المبيعات المكتملة</th>
                    <th className="py-3 px-4">نسبة التحويل (Conv. Rate)</th>
                    <th className="py-3 px-4">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800">
                  {(!data?.campaigns || data.campaigns.length === 0) ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-zinc-400 font-medium">
                        لا توجد زيارات مسجلة من حملات إعلانية بعد. انقر على &quot;توليد رابط إعلان جديد&quot; بالأعلى لإنشاء أول رابط حملة لمنتجك!
                      </td>
                    </tr>
                  ) : (
                    data.campaigns.map((camp) => {
                      const matchedProd = products.find(
                        (p) => p.id === camp.campaignProductId || p.slug === camp.campaignProductId
                      );
                      const prodName = camp.campaignProductName || matchedProd?.name || "منتج عام";
                      const prodImg = matchedProd?.mainImage || "/placeholder.jpg";

                      return (
                        <tr key={camp.campaignKey} className="hover:bg-zinc-50/70 transition-colors">
                          {/* Campaign & Source */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                                <Megaphone size={14} className="text-amber-500" />
                                {camp.campaignName}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700 w-fit">
                                {camp.campaignSource}
                              </span>
                            </div>
                          </td>

                          {/* Target Product */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-lg bg-zinc-100 overflow-hidden relative shrink-0 border border-zinc-200/60">
                                <Image
                                  src={prodImg}
                                  alt={prodName}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-zinc-900 truncate max-w-[180px]">{prodName}</span>
                                {matchedProd && (
                                  <span className="text-[10px] text-zinc-500">
                                    {formatPrice(matchedProd.salePrice ?? matchedProd.price)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Total Visits */}
                          <td className="py-3.5 px-4 font-black text-zinc-900 text-sm">
                            {camp.totalVisits} زيارة
                          </td>

                          {/* Unique Visitors */}
                          <td className="py-3.5 px-4 font-bold text-zinc-700">
                            {camp.uniqueVisitors} شخص
                          </td>

                          {/* Reached Checkout */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200/60">
                              <ShoppingCart size={12} />
                              {camp.reachedCheckout} شخص
                            </span>
                          </td>

                          {/* Completed Orders */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                              <CheckCircle2 size={12} />
                              {camp.convertedOrders} أوردر
                            </span>
                          </td>

                          {/* Conversion Rate */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-zinc-900 text-xs">{camp.conversionRate}%</span>
                              <div className="w-16 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    camp.conversionRate > 5 ? "bg-emerald-500" : "bg-amber-500"
                                  }`}
                                  style={{ width: `${Math.min(camp.conversionRate * 5, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          {/* Action Button */}
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => {
                                setSelectedCampaignFilter(camp.campaignName);
                                setActiveTab("overview");
                                setActiveFilter("campaign");
                                toast.info(`تمت الفلترة لعرض زوار حملة (${camp.campaignName}) في السجل`);
                              }}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              عرض زوارها
                            </button>
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
      )}

      {/* ── TAB 3: CHECKOUT ABANDONMENT ANALYSIS ─────────────────────── */}
      {activeTab === "abandonment" && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-black text-zinc-900">
                تحليل قمع الشراء ومعدل التخلي عن الشيك أوت (Funnel & Checkout Abandonment)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                متابعة الأشخاص الذين وصلوا لصفحة الدفع (/checkout) لمعرفة كم شخص أكمل الطلب وكم شخص غادر دون إتمام الشراء
              </p>
            </div>

            {/* Funnel Visual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200/80">
                <span className="text-xs font-bold text-zinc-500 block mb-1">1. وصلوا لصفحة الدفع (Checkout)</span>
                <h4 className="text-3xl font-black text-zinc-900">{dateRangeStats.reachedCheckout} زائر</h4>
                <p className="text-[11px] text-zinc-400 mt-1">إجمالي من دخلوا صفحة الدفع والشيك أوت</p>
              </div>

              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200/80">
                <span className="text-xs font-bold text-emerald-700 block mb-1">2. أتموا الشراء بنجاح ✅</span>
                <h4 className="text-3xl font-black text-emerald-900">{dateRangeStats.completedOrders} أوردر</h4>
                <p className="text-[11px] text-emerald-600 mt-1">أكملوا الخطوات وسجلوا الطلب بالنظام</p>
              </div>

              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200/80">
                <span className="text-xs font-bold text-amber-800 block mb-1">3. غادروا الشيك أوت دون طلب ⚠️</span>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black text-amber-900">{dateRangeStats.abandoned} شخص</h4>
                  <span className="text-xs font-black text-amber-700">({dateRangeStats.dropRate}%)</span>
                </div>
                <p className="text-[11px] text-amber-700 mt-1">وصلوا للشيك أوت ثم تراجعوا أو أغلقوا المتجر</p>
              </div>
            </div>

            {/* Direct Action Button */}
            <div className="flex items-center justify-between p-4 bg-zinc-900 text-white rounded-xl">
              <div>
                <span className="text-sm font-bold block">هل تريد فحص هؤلاء الزوار بالتفصيل؟</span>
                <span className="text-xs text-zinc-400">يمكنك مشاهدة أجهزتهم، الصفحات التي زاروها، والحملة التي أتوا منها.</span>
              </div>

              <button
                onClick={() => {
                  setActiveTab("overview");
                  setActiveFilter("abandoned");
                  toast.info("تم تطبيق فلتر زوار الشيك أوت الذين لم يطلبوا");
                }}
                className="bg-amber-500 hover:bg-amber-600 text-black px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                عرض سجل هؤلاء الزوار الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CAMPAIGN URL BUILDER MODAL ───────────────────────────────── */}
      <AnimatePresence>
        {showUrlBuilder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-zinc-100 space-y-6 max-h-[90vh] overflow-y-auto"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Megaphone size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-900">مُولّد روابط الحملات الإعلانية</h3>
                    <p className="text-xs text-zinc-400">اختر المنتج وحدد الحملة لنسخ رابط الإعلان فوراً</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowUrlBuilder(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* 1. Select Product */}
                <div>
                  <label className="text-xs font-bold text-zinc-800 block mb-1.5">
                    1. اختر المنتج المستهدف بالإعلان:
                  </label>
                  <select
                    value={builderProductId}
                    onChange={(e) => setBuilderProductId(e.target.value)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-zinc-900"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ({formatPrice(p.salePrice ?? p.price)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Campaign Name */}
                <div>
                  <label className="text-xs font-bold text-zinc-800 block mb-1.5">
                    2. اسم الحملة الإعلانية (UTM Campaign):
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: عروض_الصيف أو تيشيرت_اوفرسايز_اسود"
                    value={builderCampaignName}
                    onChange={(e) => setBuilderCampaignName(e.target.value)}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    يُفضل استخدام كلمات معبرة بدون مسافات (مثل: summer_drop_2026)
                  </span>
                </div>

                {/* 3. Platform / Source */}
                <div>
                  <label className="text-xs font-bold text-zinc-800 block mb-1.5">
                    3. منصة الإعلان (UTM Source):
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {["TikTok", "Instagram", "Facebook", "Snapchat", "Google", "WhatsApp"].map((src) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setBuilderSource(src)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          builderSource.toLowerCase() === src.toLowerCase()
                            ? "bg-zinc-900 text-white shadow-sm"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        }`}
                      >
                        {src}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={builderSource}
                    onChange={(e) => setBuilderSource(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900"
                    placeholder="أو اكتب منصة أخرى..."
                  />
                </div>

                {/* 4. Ad Medium */}
                <div>
                  <label className="text-xs font-bold text-zinc-800 block mb-1.5">
                    4. نوع الإعلان (UTM Medium):
                  </label>
                  <div className="flex gap-2">
                    {["cpc", "story", "reels", "video_ad"].map((med) => (
                      <button
                        key={med}
                        type="button"
                        onClick={() => setBuilderMedium(med)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          builderMedium === med
                            ? "bg-amber-500 text-white"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        }`}
                      >
                        {med}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resulting URL Box */}
                <div className="pt-3 border-t border-zinc-100 space-y-2">
                  <span className="text-xs font-bold text-zinc-800 flex items-center justify-between">
                    <span>رابط الإعلان الجاهز للنسخ:</span>
                    <span className="text-[11px] text-emerald-600 font-semibold">جاهز للاستخدام في الإعلانات الممولة</span>
                  </span>

                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-xs text-zinc-700 break-all dir-ltr text-left select-all">
                    {generatedCampaignUrl}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={copyGeneratedUrl}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-zinc-900/10"
                    >
                      {copiedUrl ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      <span>{copiedUrl ? "تم النسخ بنجاح!" : "نسخ الرابط الآن"}</span>
                    </button>

                    <a
                      href={generatedCampaignUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink size={15} />
                      <span>تجربة الرابط</span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
