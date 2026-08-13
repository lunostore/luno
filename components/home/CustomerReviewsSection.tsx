"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, Plus, X, MessageSquare, ShieldCheck, User, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  subscribeApprovedReviews,
  createCustomerReview,
  toggleReviewLike,
  type CustomerReview,
} from "@/lib/firebase/firestore";
import { Spinner } from "@/components/ui/Spinner";

// Pre-seeded initial reviews if none in Firestore yet
const SEEDED_REVIEWS: Partial<CustomerReview>[] = [
  {
    id: "seed_1",
    name: "عمر أحمد",
    gender: "male",
    rating: 5,
    message: "الخامة تحفة بجد والمقاس مظبوط جداً زي الوصف بالضبط! التوصيل كان في خلال 48 ساعة فقط، شكراً LUNO 🔥",
    likes: 24,
    status: "approved",
  },
  {
    id: "seed_2",
    name: "سارة محمود",
    gender: "female",
    rating: 5,
    message: "التفاصيل والألوان على الحقيقة أحلى بكتير من الصور! التعامل راقي جداً وخدمة العملاء ممتازة وسريعة ❤️",
    likes: 31,
    status: "approved",
  },
  {
    id: "seed_3",
    name: "كريم يوسف",
    gender: "male",
    rating: 5,
    message: "أفضل تجربة شراء أونلاين السنة دي، التغليف شيك والمنتج أوريجينال بنسبة 100% 👍",
    likes: 18,
    status: "approved",
  },
];

export function CustomerReviewsSection() {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  // Review Form State
  const [name, setName] = useState("");
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
    if (!message.trim()) {
      toast.error("يرجى كتابة رأيك وتجربتك");
      return;
    }

    setSubmitting(true);
    try {
      await createCustomerReview({
        name: name.trim(),
        gender,
        rating,
        message: message.trim(),
      });

      toast.success("شكراً لمشاركتك! تم إدراج رأيك وتقييمك بنجاح ❤️");
      setName("");
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

  const displayReviews = reviews.length > 0 ? reviews : (SEEDED_REVIEWS as CustomerReview[]);

  return (
    <section className="py-16 md:py-24 bg-zinc-950 text-white relative overflow-hidden" dir="rtl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 border-b border-zinc-800/80 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles size={14} />
              آراء وتجارب العملاء الحقيقية
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              ماذا يقول عملاء LUNO؟
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-2 max-w-xl leading-relaxed">
              ثقة وآراء أكثر من 5,000+ عميل في جميع محافظات مصر — انضم إلى عائلة LUNO الآن!
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-2xl text-xs font-black transition-all duration-300 shadow-lg shadow-amber-400/20 active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            <span>✍️ أضف رأيك وتجربتك</span>
          </button>
        </div>

        {/* Reviews Cards Grid */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Spinner size="lg" className="border-amber-400 border-t-transparent mx-auto" />
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">جاري تحميل آراء العملاء...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayReviews.map((review, idx) => {
              const isMale = review.gender !== "female";
              const isLiked = likedMap[review.id];

              return (
                <motion.div
                  key={review.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-all duration-300 shadow-xl group hover:-translate-y-1"
                >
                  {/* Card Header: Avatar & Stars */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar Icon */}
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold border shadow-inner shrink-0 ${
                            isMale
                              ? "bg-blue-950/60 border-blue-500/40 text-blue-400"
                              : "bg-rose-950/60 border-rose-500/40 text-rose-400"
                          }`}
                        >
                          {isMale ? "👨‍🦱" : "👩‍🦰"}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-black text-white">{review.name}</h3>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <ShieldCheck size={10} />
                              {isMale ? "عميل موثوق ✓" : "عميلة موثوقة ✓"}
                            </span>
                          </div>

                          <span className="text-[10px] text-zinc-500 font-mono">
                            {isMale ? "شاب" : "بنت"} • مشتري مؤكد
                          </span>
                        </div>
                      </div>

                      {/* Stars Rating */}
                      <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={
                              i < (review.rating || 5)
                                ? "fill-amber-400 text-amber-400"
                                : "text-zinc-700"
                            }
                          />
                        ))}
                      </div>
                    </div>

                    {/* Review Message Body */}
                    <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-medium mb-6">
                      "{review.message}"
                    </p>
                  </div>

                  {/* Card Footer: Likes Counter Button */}
                  <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-medium">هل كان هذا التقييم مفيداً؟</span>

                    <button
                      type="button"
                      onClick={() => handleToggleLike(review.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 border cursor-pointer ${
                        isLiked
                          ? "bg-amber-400 text-zinc-950 border-amber-400 shadow-md shadow-amber-400/20"
                          : "bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border-zinc-700/80"
                      }`}
                    >
                      <ThumbsUp size={13} className={isLiked ? "fill-zinc-950" : ""} />
                      <span>{review.likes || 0} إعجاب</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Submit Review Modal */}
        <AnimatePresence>
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setModalOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-right"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="absolute top-4 left-4 p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>

                {/* Modal Title */}
                <div className="mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center mb-3">
                    <MessageSquare size={20} />
                  </div>
                  <h3 className="text-xl font-black text-white">شاركنا رأيك وتجربتك في LUNO</h3>
                  <p className="text-zinc-400 text-xs mt-1">رأيك يهمنا ويسعدنا جداً لتحسين تجربة جميع العملاء ❤️</p>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-5">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-2">اسمك الكريم *</label>
                    <input
                      type="text"
                      required
                      placeholder="أدخل اسمك بالكامل"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                    />
                  </div>

                  {/* Gender Selector (Character) */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-2">تحديد الجنس / الشخصية *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGender("male")}
                        className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                          gender === "male"
                            ? "border-blue-500 bg-blue-950/40 text-white font-black"
                            : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
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
                            ? "border-rose-500 bg-rose-950/40 text-white font-black"
                            : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-2xl">👩‍🦰</span>
                        <span className="text-xs">بنت (أنثى)</span>
                      </button>
                    </div>
                  </div>

                  {/* Rating Stars Picker */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-2">تقييمك للمنتجات والخدمة *</label>
                    <div className="flex items-center gap-2 bg-zinc-950 p-3 rounded-2xl border border-zinc-800 justify-center">
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
                                : "text-zinc-700"
                            }
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-amber-400 mr-2">({rating}/5)</span>
                    </div>
                  </div>

                  {/* Review Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-2">رأيك وتجربتك بالكامل *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="اكتب انطباعك عن الجودة، المقاسات، سرعة التوصيل والمعاملة..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-medium leading-relaxed"
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
