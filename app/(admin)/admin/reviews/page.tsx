"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  CheckCircle,
  XCircle,
  Trash2,
  Plus,
  X,
  MessageSquare,
  Phone,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import {
  subscribeAllReviews,
  updateReviewStatus,
  deleteCustomerReview,
  createCustomerReview,
  type CustomerReview,
} from "@/lib/firebase/firestore";
import { Spinner } from "@/components/ui/Spinner";

type StatusTab = "all" | "approved" | "pending" | "rejected";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusTab>("all");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Manual Review Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAllReviews((data) => {
      setReviews(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "approved" | "rejected") => {
    try {
      await updateReviewStatus(id, newStatus);
      toast.success(
        newStatus === "approved"
          ? "تم اعتماد التقييم وإظهاره بالموقع! ✅"
          : "تم رفض التقييم وإخفائه ❌"
      );
    } catch {
      toast.error("فشل تغيير حالة التقييم");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت تأكد من مسح تقييم "${name}" نهائياً؟`)) return;
    try {
      await deleteCustomerReview(id);
      toast.success("تم مسح التقييم بنجاح");
    } catch {
      toast.error("فشل مسح التقييم");
    }
  };

  const handleCreateManualReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setSubmitting(true);
    try {
      await createCustomerReview({
        name: name.trim(),
        phone: phone.trim(),
        gender,
        rating,
        message: message.trim(),
        status: "pending",
      });

      toast.success("تمت إضافة التقييم بنجاح وإدراجه في قائمة بانتظار الموافقة ⏳");
      setName("");
      setPhone("");
      setMessage("");
      setRating(5);
      setGender("male");
      setAddModalOpen(false);
    } catch {
      toast.error("فشل إضافة التقييم اليدوي");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const getStatusBadge = (status: CustomerReview["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            معتمد ومعروض ✅
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            بانتظار الموافقة ⏳
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-700 border border-red-200">
            مرفوض ومخفي ❌
          </span>
        );
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">إدارة آراء وتجارب العملاء</h1>
          <p className="text-zinc-400 text-xs mt-1">
            مراجعة، قبول، أو رفض تقييمات العملاء وإضافة تقييمات يدوية
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>➕ إضافة تقييم يدوي جديد</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: "all", label: "كل التقييمات", count: reviews.length },
          { id: "approved", label: "المقبولة ومعروضة ✅", count: reviews.filter((r) => r.status === "approved").length },
          { id: "pending", label: "بانتظار الموافقة ⏳", count: reviews.filter((r) => r.status === "pending").length },
          { id: "rejected", label: "المرفوضة ❌", count: reviews.filter((r) => r.status === "rejected").length },
        ].map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as StatusTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-zinc-900 text-white shadow-md"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${isActive ? "bg-white/20" : "bg-zinc-100 text-zinc-500"}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Reviews List Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Spinner size="lg" className="border-zinc-900 border-t-transparent mx-auto" />
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">جارٍ تحميل آراء العملاء...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-zinc-200 rounded-3xl bg-white space-y-3">
          <MessageSquare size={32} className="mx-auto text-zinc-300 stroke-[1.5]" />
          <p className="text-sm font-bold text-zinc-600">لا توجد تقييمات في هذا القسم حالياً</p>
          <p className="text-xs text-zinc-400">أي تقييم يقوم العملاء بإرساله من المتجر سيظهر هنا للمراجعة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((review) => {
            const isMale = review.gender !== "female";

            return (
              <div
                key={review.id}
                className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Customer & Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border shadow-inner ${
                          isMale ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-rose-50 border-rose-200 text-rose-600"
                        }`}
                      >
                        {isMale ? "👨‍🦱" : "👩‍🦰"}
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-zinc-900">{review.name}</h3>
                        <span className="text-[10px] text-zinc-400 font-medium block">
                          {isMale ? "شاب (ذكر)" : "بنت (أنثى)"} • {review.likes || 0} إعجاب 👍
                        </span>

                        {review.phone ? (
                          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-200/80 w-fit">
                            <Phone size={11} className="text-emerald-600" />
                            <span>{review.phone}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(review.phone!);
                                toast.success("تم نسخ رقم الهاتف 📋");
                              }}
                              className="text-zinc-400 hover:text-zinc-900 transition-colors mr-1 cursor-pointer"
                              title="نسخ رقم الهاتف"
                            >
                              <Copy size={11} />
                            </button>
                            <a
                              href={`https://wa.me/2${review.phone.replace(/^0/, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:underline mr-1 font-sans text-[10px] font-bold"
                              title="مراسلة واتساب"
                            >
                              💬 واتساب
                            </a>
                          </div>
                        ) : (
                          <span className="text-[9px] text-zinc-400 italic block mt-0.5">بدون رقم هاتف</span>
                        )}
                      </div>
                    </div>

                    <div>{getStatusBadge(review.status)}</div>
                  </div>

                  {/* Stars Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={
                          i < (review.rating || 5)
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-200"
                        }
                      />
                    ))}
                    <span className="text-[10px] font-bold text-zinc-500 mr-1.5">({review.rating}/5 نجوم)</span>
                  </div>

                  {/* Review Text */}
                  <p className="text-zinc-700 text-xs leading-relaxed font-medium bg-zinc-50 p-3 rounded-xl border border-zinc-100/80 mb-4">
                    &quot;{review.message}&quot;
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {review.status !== "approved" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(review.id, "approved")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                        title="اعتماد ونشر التقييم فورا على الموقع"
                      >
                        <CheckCircle size={14} />
                        <span>✅ موافقة وعرض بالموقع</span>
                      </button>
                    )}

                    {review.status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(review.id, "rejected")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                        title="رفض وإخفاء التقييم من الموقع"
                      >
                        <XCircle size={14} />
                        <span>❌ رفض وإخفاء</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(review.id, review.name)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="مسح التقييم نهائياً"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Add Review Modal */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10 text-right space-y-4"
            >
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="absolute top-4 left-4 p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
              >
                <X size={16} />
              </button>

              <h3 className="text-lg font-black text-zinc-900">➕ إضافة تقييم يدوي جديد</h3>

              <form onSubmit={handleCreateManualReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">اسم العميل *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد مصطفى"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">رقم الهاتف (اختياري)</label>
                  <input
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">الجنس / الشخصية *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender("male")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        gender === "male"
                          ? "border-blue-600 bg-blue-50 text-blue-900"
                          : "border-zinc-200 text-zinc-600"
                      }`}
                    >
                      <span>👨‍🦱</span>
                      <span>شاب (ذكر)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGender("female")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        gender === "female"
                          ? "border-rose-600 bg-rose-50 text-rose-900"
                          : "border-zinc-200 text-zinc-600"
                      }`}
                    >
                      <span>👩‍🦰</span>
                      <span>بنت (أنثى)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">التقييم (النجوم) *</label>
                  <div className="flex items-center gap-1 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 focus:outline-none cursor-pointer"
                      >
                        <Star
                          size={20}
                          className={
                            star <= rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-zinc-300"
                          }
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-zinc-900 mr-2">({rating}/5)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">نص الرأي والتجربة *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="اكتب التقييم هنا..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? <Spinner size="sm" className="border-white" /> : "إضافة التقييم الآن ✨"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
