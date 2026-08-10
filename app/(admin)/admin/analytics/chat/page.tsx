"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import {
  subscribeChatAnalytics,
  type ChatAnalyticsSummary,
} from "@/lib/firebase/firestore";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/features/auth/AuthProvider";

export default function AdminChatAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<ChatAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;

    const unsubscribe = subscribeChatAnalytics((summary) => {
      setData(summary);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const formatRelativeTime = (timestamp: any): string => {
    if (!timestamp) return "منذ فترة قصيرة";
    let ms = 0;
    const ts = timestamp as any;
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Spinner size="lg" />
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">
          جارٍ تحميل تحليلات الشات بوت والذكاء الاصطناعي...
        </p>
      </div>
    );
  }

  const events = data?.events || [];
  const filteredEvents = events.filter((ev) => {
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
    <div className="space-y-6 pb-12 font-sans" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-300/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
            <Bot size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              <span>تحليلات شات بوت المبيعات (AI Sales Analytics)</span>
              <Sparkles size={18} className="text-amber-400 animate-pulse" />
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              متابعة تفاعلات الذكاء الاصطناعي، المنتجات المقترحة، ومعدل تحويل الزوار إلى مشتريات 🚀
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-2xl text-zinc-400">
          <RefreshCw size={14} className="text-emerald-400 animate-spin" />
          <span>تحديث مباشر لحظي (Realtime)</span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Conversations */}
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
              {data?.totalConversations || 0}
            </span>
            <span className="text-[11px] text-zinc-500 block mt-1">محادثة مع الزوار</span>
          </div>
        </motion.div>

        {/* Total Recommendations */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-bold">المنتجات المقترحة</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Shirt size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-amber-300 font-mono">
              {data?.totalRecommendations || 0}
            </span>
            <span className="text-[11px] text-zinc-500 block mt-1">توصية منتج بواسطة الذكاء الاصطناعي</span>
          </div>
        </motion.div>

        {/* Cart Adds from Chat */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-bold">إضافات السلة من الشات</span>
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

        {/* Generated Revenue */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-zinc-900/80 border border-amber-500/30 flex flex-col justify-between bg-gradient-to-tr from-amber-950/20 to-zinc-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-bold">إجمالي المبيعات المقدرة</span>
            <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-amber-300 font-mono">
              {data?.estimatedRevenue || 0} ج.م
            </span>
            <span className="text-[11px] text-zinc-400 block mt-1">من المنتجات المضافة من الشات</span>
          </div>
        </motion.div>
      </div>

      {/* Grid: Top Recommended Products & Realtime Events Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Recommended & Added Products */}
        <div className="lg:col-span-1 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Award size={18} className="text-amber-400" />
              <span>الأكثر تحويلاً للمبيعات</span>
            </h3>
            <span className="text-[10px] text-zinc-500">Top Chat Items</span>
          </div>

          {data?.topProducts && data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((prod, idx) => (
                <div
                  key={prod.productId + idx}
                  className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-400/10 text-amber-400 text-xs font-bold flex items-center justify-center font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[150px]">
                        {prod.name}
                      </h4>
                      <span className="text-[10px] text-zinc-500">كود: {prod.productId}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl font-mono">
                    {prod.count} إضافة
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 text-xs">
              لم يتم تسجيل إضافات للسلة عبر الشات بعد.
            </div>
          )}
        </div>

        {/* Live Chat Events Feed */}
        <div className="lg:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Clock size={18} className="text-amber-400" />
                <span>سجل تفاعلات الذكاء الاصطناعي الحية</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                تتبع أحداث الإقناع والتوصية والإضافة للسلة بضغطة زر
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute right-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="بحث في السجل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/80"
              />
            </div>
          </div>

          {filteredEvents.length > 0 ? (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredEvents.map((ev, idx) => {
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
                          <MessageSquare size={16} />
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
                              : "بدء محادثة"}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            جلسة: {ev.sessionId?.substring(0, 12)}
                          </span>
                        </div>

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
              لا توجد تفاعلات مطابقة للبحث حالياً.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
