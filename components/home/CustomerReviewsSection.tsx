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
} from "lucide-react";
import { toast } from "sonner";
import {
  subscribeApprovedReviews,
  createCustomerReview,
  toggleReviewLike,
  type CustomerReview,
} from "@/lib/firebase/firestore";
import { Spinner } from "@/components/ui/Spinner";

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
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Load liked state from localStorage
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
        r.id === reviewId ? { ...r, likes: r.likes + (isLiked ? -1 : 1) } : r
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
      toast.error("يرجى كتابة اسمك");
      return;
    }
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      toast.error("يرجى إدخال رقم الهاتف للتأكيد (إجباري)");
      return;
    }
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      toast.error("يرجى إدخال رقم هاتف مصري صحيح يتكون من 11 رقم (مثال: 01012345678)");
      return;
    }
    if (!message.trim()) {
      toast.error("يرجى كتابة رأيك وتجربتك");
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

      toast.success("شكراً لمشاركتك! تم إرسال تقييمك بنجاح وسيعرض بالموقع فور موافقة الأدمن ❤️");
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

  // Enable infinite marquee loop ONLY when there are at least 3 distinct reviews!
  const isMarquee = reviews.length >= 3;
  const marqueeMultiplier = isMarquee ? Math.max(2, Math.ceil(8 / reviews.length)) : 1;
  const displayReviews = reviews.length > 0 ? Array(marqueeMultiplier).fill(reviews).flat() : [];

  return (
    <section className="py-12 md:py-20 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white relative overflow-hidden transition-colors duration-300" dir="rtl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
              ماذا يقول عملاء LUNO؟
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm mt-1.5 max-w-xl leading-relaxed font-medium">
              آراء حقيقية من عملائنا في جميع محافظات مصر — شاركنا رأيك وتجربتك الآن!
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-2xl text-xs font-black transition-all duration-300 shadow-md shadow-amber-400/20 active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            <span>✍️ أضف رأيك وتجربتك</span>
          </button>
        </div>

        {/* Reviews Content */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Spinner size="lg" className="border-amber-400 border-t-transparent mx-auto" />
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">جاري تحميل آراء العملاء...</p>
          </div>
        ) : reviews.length === 0 ? (
          /* Clean Empty State when 0 real reviews exist */
          <div className="py-14 px-6 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-500 flex items-center justify-center mx-auto text-2xl">
              💬
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-white">لا توجد تقييمات معروضة حالياً</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                كن أول من يشارك رأيه وتجربته مع LUNO Store وتظهر تجربتك هنا للجميع!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-2xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>✍️ أضف أول تقييم لك الآن</span>
            </button>
          </div>
        ) : (
          /* Reviews Display Track: Animated Marquee if >=3 reviews, or Centered Grid if <3 reviews */
          <div
            className="relative overflow-hidden py-4 -mx-4 px-4"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Soft gradient edge blurs only for Marquee */}
            {isMarquee && (
              <>
                <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-zinc-50 dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-zinc-50 dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
              </>
            )}

            <motion.div
              key={`reviews-track-${reviews.length}-${reviews.map((r) => r.id).join("_")}`}
              className={`flex gap-4 ${isMarquee ? "w-max" : "justify-center flex-wrap"}`}
              animate={isMarquee && !isPaused ? { x: ["0%", "50%"] } : {}}
              transition={
                isMarquee
                  ? {
                      x: {
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: Math.max(16, reviews.length * 6),
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
                    className="w-[270px] sm:w-[300px] md:w-[330px] shrink-0 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 shadow-sm dark:shadow-lg group"
                  >
                    {/* Card Header: Avatar & Stars */}
                    <div>
                      <div className="flex items-start justify-between gap-2.5 mb-3">
                        <div className="flex items-center gap-2.5">
                          {/* Avatar Icon */}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border shadow-inner shrink-0 ${
                              isMale
                                ? "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-500/40 text-blue-600 dark:text-blue-400"
                                : "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-500/40 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isMale ? "👨‍🦱" : "👩‍🦰"}
                          </div>

                          <div>
                            <div className="flex items-center gap-1">
                              <h3 className="text-xs font-black text-zinc-900 dark:text-white truncate max-w-[95px] sm:max-w-[115px]">
                                {review.name}
                              </h3>
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <ShieldCheck size={9} />
                                {isMale ? "موثوق ✓" : "موثوقة ✓"}
                              </span>
                            </div>

                            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono block mt-0.5">
                              {isMale ? "شاب" : "بنت"} • تقييم معتمد
                            </span>
                          </div>
                        </div>

                        {/* Stars Rating */}
                        <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={10}
                              className={
                                i < (review.rating || 5)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-zinc-300 dark:text-zinc-700"
                              }
                            />
                          ))}
                        </div>
                      </div>

                      {/* Review Message Body */}
                      <p className="text-zinc-700 dark:text-zinc-300 text-xs leading-relaxed font-medium mb-4 line-clamp-4">
                        &quot;{review.message}&quot;
                      </p>
                    </div>

                    {/* Card Footer: Likes Counter Button */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
                      <span className="text-[9px] text-zinc-400 font-medium">مفيد؟</span>

                      <button
                        type="button"
                        onClick={() => handleToggleLike(review.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-300 border cursor-pointer ${
                          isLiked
                            ? "bg-amber-400 text-zinc-950 border-amber-400 shadow-sm"
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

        {/* Submit Review Modal - Z-INDEX FIXED TO Z-[9999] */}
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

              {/* Modal Card Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 0 }}
                className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-[9999] text-right my-auto max-h-[88vh] overflow-y-auto scrollbar-none"
              >
                {/* Close Button X (Prominent & High Z-index) */}
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="absolute top-4 left-4 p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all z-20 border border-zinc-200 dark:border-zinc-700/60 shadow-sm cursor-pointer"
                  title="إغلاق النافذة"
                >
                  <X size={18} />
                </button>

                {/* Modal Title */}
                <div className="mb-6 pt-2">
                  <div className="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-500 flex items-center justify-center mb-3">
                    <MessageSquare size={22} />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">شاركنا رأيك وتجربتك في LUNO</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 font-medium">رأيك يهمنا ويسعدنا جداً لتحسين تجربة جميع العملاء ❤️</p>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-5">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">اسمك الكريم *</label>
                    <input
                      type="text"
                      required
                      placeholder="أدخل اسمك بالكامل"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 font-semibold"
                    />
                  </div>

                  {/* Phone Input */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                      رقم الهاتف (إجباري للتأكيد - سري للأدمن فقط) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="01xxxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 font-mono font-semibold"
                    />
                  </div>

                  {/* Gender Selector (Character) */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">تحديد الجنس / الشخصية *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGender("male")}
                        className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                          gender === "male"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-white font-black"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-2xl">👨‍🦱</span>
                        <span className="text-xs">شاب (ذكر)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGender("female")}
                        className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                          gender === "female"
                            ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-white font-black"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-2xl">👩‍🦰</span>
                        <span className="text-xs">بنت (أنثى)</span>
                      </button>
                    </div>
                  </div>

                  {/* Rating Stars Picker */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">تقييمك للمنتجات والخدمة *</label>
                    <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-125 transition-transform focus:outline-none cursor-pointer"
                        >
                          <Star
                            size={24}
                            className={
                              star <= rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-zinc-300 dark:text-zinc-700"
                            }
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-amber-500 dark:text-amber-400 mr-2">({rating}/5)</span>
                    </div>
                  </div>

                  {/* Review Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">رأيك وتجربتك بالكامل *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="اكتب انطباعك عن الجودة، المقاسات، سرعة التوصيل والمعاملة..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 font-medium leading-relaxed"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-2xl text-xs font-black transition-all shadow-lg shadow-amber-400/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <Spinner size="sm" className="border-zinc-950" />
                    ) : (
                      <>
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
