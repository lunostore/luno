"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ThumbsUp,
  Plus,
  X,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Award,
  Quote,
  CheckCircle2,
  Lock,
  Heart,
  MessageSquareQuote,
} from "lucide-react";
import { toast } from "sonner";
import {
  subscribeApprovedReviews,
  createCustomerReview,
  toggleReviewLike,
  type CustomerReview,
} from "@/lib/firebase/firestore";
import { Spinner } from "@/components/ui/Spinner";

const RATING_LABELS: Record<number, string> = {
  5: "ممتاز جداً (5/5) 🔥",
  4: "رائع جداً (4/5) ⭐",
  3: "جيد (3/5) 👍",
  2: "مقبول (2/5) 😐",
  1: "يحتاج تحسين (1/5) ⚠️",
};

export function CustomerReviewsSection() {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [isPaused, setIsPaused] = useState(false);

  // Review Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const savedLikes = localStorage.getItem("luno_liked_reviews");
      if (savedLikes) {
        setLikedMap(JSON.parse(savedLikes));
      }
    } catch {
      // Ignore localStorage errors
    }

    const unsubscribe = subscribeApprovedReviews((data) => {
      setReviews(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleLike = async (reviewId: string) => {
    const isLiked = likedMap[reviewId];
    const newLikedMap = { ...likedMap, [reviewId]: !isLiked };
    setLikedMap(newLikedMap);

    try {
      localStorage.setItem("luno_liked_reviews", JSON.stringify(newLikedMap));
    } catch {
      // Ignore
    }

    // Optimistic UI update
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, likes: (r.likes || 0) + (isLiked ? -1 : 1) } : r
      )
    );

    try {
      await toggleReviewLike(reviewId, isLiked ? -1 : 1);
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("يرجى كتابة اسمك الكريم");
      return;
    }
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      toast.error("يرجى إدخال رقم الهاتف للتأكيد (سري ولن يظهر للعامة)");
      return;
    }
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      toast.error("يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقماً (مثال: 01012345678)");
      return;
    }
    if (!message.trim()) {
      toast.error("يرجى كتابة رأيك وتجربتك بالتفصيل");
      return;
    }

    setSubmitting(true);
    try {
      await createCustomerReview({
        name: name.trim(),
        phone: cleanPhone,
        gender,
        rating,
        message: message.trim(),
        status: "pending",
      });

      toast.success("شكراً لمشاركتك! تم إرسال تقييمك بنجاح وسيعرض بالموقع فور اعتماده ❤️");
      setName("");
      setPhone("");
      setMessage("");
      setRating(5);
      setGender("male");
      setModalOpen(false);
    } catch {
      toast.error("فشل إرسال التقييم، يرجى المحاولة مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  // Enable infinite marquee loop ONLY when there are at least 3 distinct reviews
  const isMarquee = reviews.length >= 3;
  const marqueeMultiplier = isMarquee ? Math.max(2, Math.ceil(8 / reviews.length)) : 1;
  const displayReviews = reviews.length > 0 ? Array(marqueeMultiplier).fill(reviews).flat() : [];

  return (
    <section
      className="py-16 md:py-28 bg-gradient-to-b from-zinc-50 via-white to-zinc-50 dark:from-black dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white relative overflow-hidden transition-colors duration-500"
      dir="rtl"
    >
      {/* Ambient Luxury Glow Effects */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-8">
          <div className="space-y-3">
            {/* Luxury Top Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 dark:border-amber-400/20 text-amber-600 dark:text-amber-400 text-xs font-black tracking-wide">
              <Sparkles size={14} className="text-amber-500 fill-amber-500" />
              <span>تجارب حقيقية • REAL EXPERIENCES</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
              ماذا يقول عملاء <span className="bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-yellow-300 bg-clip-text text-transparent">LUNO</span>؟
            </h2>

            <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm max-w-2xl leading-relaxed font-medium">
              آراء وتجارب موثقة من عملائنا في جميع محافظات مصر — شاركنا رأيك وانطباعك بكل شفافية!
            </p>
          </div>

          {/* Add Review Action Button */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <motion.button
              type="button"
              onClick={() => setModalOpen(true)}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="relative group overflow-hidden flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 dark:from-white dark:via-zinc-100 dark:to-white text-white dark:text-zinc-950 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-xl shadow-black/10 dark:shadow-white/5 cursor-pointer border border-zinc-800 dark:border-zinc-200"
            >
              {/* Shimmer flare effect */}
              <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 dark:via-black/10 to-transparent skew-x-[-25deg] group-hover:translate-x-[250%] transition-transform duration-1000 ease-out" />
              
              <div className="p-1 rounded-lg bg-amber-400 text-zinc-950">
                <Plus size={14} className="stroke-[3]" />
              </div>
              <span>أضف رأيك وتجربتك</span>
            </motion.button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <Spinner size="lg" className="border-amber-400 border-t-transparent mx-auto" />
            <p className="text-xs text-zinc-500 font-bold tracking-wider">جاري تحميل تقييمات العملاء...</p>
          </div>
        ) : reviews.length === 0 ? (
          /* 💎 Ultra-Luxury Glassmorphic Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative max-w-2xl mx-auto rounded-[32px] p-8 sm:p-12 text-center bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden group"
          >
            {/* Background Decorative Rings */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />

            {/* Glowing Center Badge */}
            <div className="relative mb-6 inline-block">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-amber-400/10 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner text-amber-500 dark:text-amber-400">
                <MessageSquareQuote size={40} className="stroke-[1.5]" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-md">
                <Star size={14} className="fill-white" />
              </div>
            </div>

            {/* Empty State Titles */}
            <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">
              كن أول من يشارك تجربته مع <span className="text-amber-500">LUNO</span>
            </h3>
            
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed font-medium mb-8">
              رأيك يبني الثقة ويساعد مجتمعنا على اختيار القطع المناسبة! شاركنا انطباعك عن الجودة والمقاسات وسرعة التوصيل.
            </p>

            {/* Trust Indicators Pill Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-right">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/50">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} />
                </div>
                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">تقييم موثوق 100%</span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/50">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Lock size={15} />
                </div>
                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">خصوصية تامة للبيانات</span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/50">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Award size={15} />
                </div>
                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">نشر فوري معتمد</span>
              </div>
            </div>

            {/* Luxury CTA Button */}
            <motion.button
              type="button"
              onClick={() => setModalOpen(true)}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-zinc-950 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 cursor-pointer"
            >
              <Sparkles size={16} />
              <span>✍️ أضف أول تقييم لك الآن</span>
            </motion.button>
          </motion.div>
        ) : (
          /* ⭐ Active Dynamic Reviews (Marquee Track or Flex Layout) */
          <div
            className="relative overflow-hidden py-4 -mx-4 px-4"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Smooth Edge Fades for Seamless Marquee */}
            {isMarquee && (
              <>
                <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-zinc-50 dark:from-black to-transparent z-10 pointer-events-none" />
                <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-zinc-50 dark:from-black to-transparent z-10 pointer-events-none" />
              </>
            )}

            <motion.div
              key={`reviews-track-${reviews.length}-${reviews.map((r) => r.id).join("_")}`}
              className={`flex gap-5 ${isMarquee ? "w-max" : "justify-center flex-wrap"}`}
              animate={isMarquee && !isPaused ? { x: ["0%", "50%"] } : {}}
              transition={
                isMarquee
                  ? {
                      x: {
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: Math.max(18, reviews.length * 7),
                        ease: "linear",
                      },
                    }
                  : {}
              }
            >
              {displayReviews.map((review, idx) => {
                const isMale = review.gender !== "female";
                const isLiked = likedMap[review.id];

                return (
                  <div
                    key={`${review.id}-${idx}`}
                    className="w-[280px] sm:w-[320px] md:w-[350px] shrink-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-800/90 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-400/50 dark:hover:border-amber-400/40 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 group"
                  >
                    <div>
                      {/* Card Header: Avatar, Name & Verification Badge */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          {/* Character Avatar */}
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-bold border shadow-inner shrink-0 ${
                              isMale
                                ? "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-500/40 text-blue-600 dark:text-blue-400"
                                : "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-500/40 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isMale ? "👨‍🦱" : "👩‍🦰"}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white truncate max-w-[110px] sm:max-w-[130px]">
                                {review.name}
                              </h3>
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <ShieldCheck size={9} />
                                {isMale ? "موثوق ✓" : "موثوقة ✓"}
                              </span>
                            </div>

                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium block mt-0.5">
                              {isMale ? "عميل معتمد" : "عميلة معتمدة"}
                            </span>
                          </div>
                        </div>

                        {/* Stars Rating */}
                        <div className="flex items-center gap-0.5 bg-amber-500/10 dark:bg-amber-400/10 px-2 py-1 rounded-xl border border-amber-500/20 dark:border-amber-400/20 shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={11}
                              className={
                                i < (review.rating || 5)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-zinc-300 dark:text-zinc-700"
                              }
                            />
                          ))}
                        </div>
                      </div>

                      {/* Review Quote Message */}
                      <div className="relative mb-4">
                        <Quote size={16} className="text-amber-500/30 dark:text-amber-400/20 absolute -top-1 right-0 rotate-180" />
                        <p className="text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed font-medium pr-5 line-clamp-4">
                          &quot;{review.message}&quot;
                        </p>
                      </div>
                    </div>

                    {/* Card Footer: Interactive Likes */}
                    <div className="pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 font-medium">هل كان هذا الرأي مفيداً؟</span>

                      <button
                        type="button"
                        onClick={() => handleToggleLike(review.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 border cursor-pointer active:scale-95 ${
                          isLiked
                            ? "bg-amber-400 text-zinc-950 border-amber-400 shadow-md shadow-amber-400/20"
                            : "bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/80"
                        }`}
                      >
                        <ThumbsUp size={12} className={isLiked ? "fill-zinc-950" : ""} />
                        <span>{review.likes || 0} إعجاب</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        )}

        {/* 🌟 Interactive Review Submission Modal */}
        <AnimatePresence>
          {modalOpen && (
            <div className="fixed inset-0 z-[9999] overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setModalOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998]"
              />

              {/* Modal Dialog Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 10 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 rounded-[32px] p-6 sm:p-8 shadow-2xl z-[9999] text-right my-auto max-h-[90vh] overflow-y-auto scrollbar-none"
              >
                {/* Close Button X */}
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="absolute top-5 left-5 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all z-20 border border-zinc-200 dark:border-zinc-700 shadow-sm cursor-pointer"
                  title="إغلاق النافذة"
                >
                  <X size={18} />
                </button>

                {/* Modal Title */}
                <div className="mb-6 pt-1">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mb-3">
                    <MessageSquare size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white">شاركنا رأيك وتجربتك في LUNO</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1.5 font-medium">رأيك يسعدنا جداً ويفيد جميع العملاء الجدد في اتخاذ قراراتهم ❤️</p>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-5">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">اسمك الكريم *</label>
                    <input
                      type="text"
                      required
                      placeholder="أدخل اسمك أو لقبك"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 font-semibold"
                    />
                  </div>

                  {/* Phone Input with Privacy Badge */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        رقم الهاتف للتأكيد *
                      </label>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Lock size={10} /> سري للإدارة فقط
                      </span>
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="01xxxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 font-mono font-semibold"
                      dir="ltr"
                    />
                  </div>

                  {/* Character Avatar Picker */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">تحديد الشخصية / الأيقونة *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGender("male")}
                        className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                          gender === "male"
                            ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-white font-black shadow-sm"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-2xl">👨‍🦱</span>
                        <span className="text-xs">شاب (ذكر)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGender("female")}
                        className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                          gender === "female"
                            ? "border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-white font-black shadow-sm"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-2xl">👩‍🦰</span>
                        <span className="text-xs">بنت (أنثى)</span>
                      </button>
                    </div>
                  </div>

                  {/* Star Rating Picker with Live Feedback */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">تقييمك للمنتجات والخدمة *</label>
                      <span className="text-xs font-bold text-amber-500 dark:text-amber-400">
                        {RATING_LABELS[hoverRating || rating]}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = star <= (hoverRating || rating);
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => setRating(star)}
                            className="p-1 hover:scale-125 transition-transform focus:outline-none cursor-pointer"
                          >
                            <Star
                              size={28}
                              className={
                                active
                                  ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                                  : "text-zinc-300 dark:text-zinc-700"
                              }
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Review Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">رأيك وتجربتك بالكامل *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="اكتب تجربتك بكل صراحة (الخامات، الفيت والمقاسات، التغليف، سرعة التوصيل)..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 font-medium leading-relaxed"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-lg shadow-amber-500/25 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    {submitting ? (
                      <Spinner size="sm" className="border-zinc-950" />
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>إرسال التقييم الآن ✨</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
