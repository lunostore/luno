"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronRight, Sparkles, Trash2, Download, MessageCircle, ImageOff, Copy, Check, FileSpreadsheet, Printer, Truck, AlertTriangle, Package } from "lucide-react";
import { getOrders, updateOrderStatus, deleteOrder, setManualTrackingNumber } from "@/lib/firebase/firestore";
import { formatPrice, formatDate, buildWhatsAppConfirmationMessage } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/order";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/types/order";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "sonner";
import { exportOrdersToExcel, printOrdersPDF } from "@/lib/export-orders";


const STATUS_TABS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "كل الطلبات" },
  { value: "pending", label: "في الانتظار" },
  { value: "confirmed", label: "مؤكدة" },
  { value: "shipping", label: "جارٍ الشحن" },
  { value: "delivered", label: "مُسلَّمة" },
  { value: "cancelled", label: "ملغية" },
];

const STATUS_NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipping", "cancelled"],
  shipping: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const statusDots: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-blue-500",
  shipping: "bg-indigo-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingScreenshot, setDeletingScreenshot] = useState(false);
  const [copiedWaMsg, setCopiedWaMsg] = useState(false);
  const [manualTracking, setManualTracking] = useState("");
  const [savingTracking, setSavingTracking] = useState(false);
  const [autoShippingId, setAutoShippingId] = useState<string | null>(null);
  const [autoShippingAll, setAutoShippingAll] = useState(false);

  const handleAutoShip = async (orderId?: string) => {
    if (orderId) {
      setAutoShippingId(orderId);
    } else {
      setAutoShippingAll(true);
    }

    const toastId = toast.loading(
      orderId ? "جارٍ تشغيل بوت الشحن للطلب..." : "جارٍ تشغيل بوت الشحن لجميع الطلبات المؤكدة..."
    );

    try {
      const res = await fetch("/api/admin/shipping/auto-ship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderId ? { orderId } : {}),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "تم تنفيذ أتمتة الشحن بنجاح 🚀", { id: toastId });
        const freshOrders = await getOrders();
        setOrders(freshOrders);
        if (selectedOrder) {
          const updated = freshOrders.find((o) => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      } else {
        toast.error(data.error || "فشل تشغيل بوت الشحن التلقائي", { id: toastId, duration: 6000 });
      }
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء الاتصال ببوت الشحن", { id: toastId });
    } finally {
      setAutoShippingId(null);
      setAutoShippingAll(false);
    }
  };

  const handleSendWhatsAppConfirmation = (order: Order) => {
    const waNumber = (order.whatsappPhone || order.phone).replace(/^0/, "20");
    const messageText = buildWhatsAppConfirmationMessage(order, "LUNO");
    const encoded = encodeURIComponent(messageText);
    window.open(`https://wa.me/${waNumber}?text=${encoded}`, "_blank");
  };

  const handleCopyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label} بنجاح!`);
  };

  const handleCopyFullShippingData = (order: Order) => {
    const itemsList = order.items
      .map((item, idx) => `${idx + 1}. ${item.productName} (اللون: ${item.selectedColor.name} | المقاس: ${item.selectedSize} | الكمية: ${item.quantity})`)
      .join("\n");

    const fullData = `📦 بيانات الشحن للطلب #${order.id.slice(0, 8).toUpperCase()}
👤 اسم العميل: ${order.customerName}
📱 رقم الهاتف الأول: ${order.phone}
📞 رقم الهاتف الثاني: ${order.secondaryPhone || "غير مدخل"}
📍 المحافظة: ${order.governorate || "غير محدد"}
🏙️ المنطقة/الحي: ${order.city}
🏠 العنوان بالتفصيل: ${order.address}
🛍️ المنتجات:
${itemsList}
💵 المبلغ المطلوب تحصيله: ${order.total} ج.م (شامل الشحن)
💳 طريقة الدفع: ${PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
📝 ملاحظات: ${order.notes || "لا يوجد"}`;

    navigator.clipboard.writeText(fullData);
    toast.success("تم نسخ كامل بيانات الشحن لشركة الشحن بنجاح! 🚀");
  };

  const handleCopyWhatsAppMessage = (order: Order) => {
    const messageText = buildWhatsAppConfirmationMessage(order, "LUNO");
    navigator.clipboard.writeText(messageText);
    setCopiedWaMsg(true);
    toast.success("تم نسخ رسالة تأكيد الطلب للعميل (تصميم 1)");
    setTimeout(() => setCopiedWaMsg(false), 2500);
  };

  const handleSaveManualTracking = async (orderId: string) => {
    if (!manualTracking.trim()) return;
    setSavingTracking(true);
    try {
      await setManualTrackingNumber(orderId, manualTracking.trim());
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, trackingNumber: manualTracking.trim(), status: "shipping" as const, shippingProvider: "manual" }
            : o
        )
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, trackingNumber: manualTracking.trim(), status: "shipping" as const, shippingProvider: "manual" } : prev
        );
      }
      toast.success("تم حفظ رقم التتبع وتحويل الطلب إلى جارٍ الشحن ✅");
      setManualTracking("");
    } catch {
      toast.error("فشل حفظ رقم التتبع");
    } finally {
      setSavingTracking(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    getOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const name = (o.customerName || "").toLowerCase();
    const phone = o.phone || o.customerPhone || "";
    const id = (o.id || "").toLowerCase();
    const s = search.toLowerCase();

    const matchSearch =
      search === "" ||
      name.includes(s) ||
      phone.includes(search) ||
      id.includes(s);
    return matchStatus && matchSearch;
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // Find the current order to get previousStatus
    const currentOrder = orders.find((o) => o.id === orderId);
    const previousStatus = currentOrder?.status;

    // Confirmation prompts for stock-affecting actions
    if (newStatus === "confirmed" && previousStatus === "pending") {
      if (!confirm("تأكيد الطلب سيخصم المخزون تلقائياً. متأكد؟")) return;
    }
    if (newStatus === "cancelled" && (previousStatus === "confirmed" || previousStatus === "shipping")) {
      if (!confirm("إلغاء طلب مؤكد سيعيد المخزون تلقائياً. متأكد؟")) return;
    }

    setUpdatingId(orderId);
    try {
      const { warnings } = await updateOrderStatus(orderId, newStatus, previousStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
      }

      // Show stock operation results & automatically trigger shipping bot
      if (newStatus === "confirmed" && previousStatus === "pending") {
        toast.success("✅ تم تأكيد الطلب وخصم المخزون تلقائياً");
        // 🚀 Auto-trigger shipping bot immediately!
        handleAutoShip(orderId);
      } else if (newStatus === "cancelled" && (previousStatus === "confirmed" || previousStatus === "shipping")) {
        toast.success("🔄 تم إلغاء الطلب واستعادة المخزون تلقائياً");
      } else {
        toast.success(`تم تحديث الحالة إلى: ${ORDER_STATUS_LABELS[newStatus]}`);
      }

      // Show any warnings
      if (warnings && warnings.length > 0) {
        warnings.forEach((w) => toast.warning(w, { duration: 8000 }));
      }
    } catch {
      toast.error("فشل تحديث الحالة");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟")) return;
    try {
      await deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
      toast.success("تم حذف الطلب بنجاح");
    } catch {
      toast.error("فشل حذف الطلب");
    }
  };

  // Delete transfer screenshot from Cloudinary + clear from order
  const handleDeleteScreenshot = async (order: Order) => {
    if (!order.transferScreenshot) return;
    if (!confirm("هل تريد مسح صورة التحويل نهائياً؟")) return;
    setDeletingScreenshot(true);
    try {
      // Extract public_id from Cloudinary URL
      const url = order.transferScreenshot;
      const parts = url.split("/");
      const fileName = parts[parts.length - 1].split(".")[0];
      const folderIndex = parts.findIndex((p) => p === "transfer_screenshots");
      const publicId = folderIndex >= 0
        ? `transfer_screenshots/${fileName}`
        : fileName;

      await fetch("/api/admin/orders/delete-screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, publicId }),
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, transferScreenshot: undefined } : o
        )
      );
      setSelectedOrder((prev) =>
        prev ? { ...prev, transferScreenshot: undefined } : prev
      );
      toast.success("تم مسح صورة التحويل");
    } catch {
      toast.error("فشل مسح الصورة");
    } finally {
      setDeletingScreenshot(false);
    }
  };

  // Send screenshot via WhatsApp
  const handleWhatsAppScreenshot = (order: Order) => {
    if (!order.transferScreenshot) return;
    const waNumber = order.whatsappPhone || order.phone;
    const msg = encodeURIComponent(
      `إيصال تحويل طلب رقم #${order.id.slice(0, 8).toUpperCase()}\n\n${order.transferScreenshot}`
    );
    window.open(`https://wa.me/${waNumber.replace(/^0/, "20")}?text=${msg}`, "_blank");
  };

  const handleExportExcel = () => {
    try {
      exportOrdersToExcel(filtered, `LUNO_Orders_${statusFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success("تم تصدير الطلبات إلى ملف Excel بنجاح! 📊");
    } catch (err: any) {
      toast.error(err.message || "فشل تصدير الطلبات إلى Excel");
    }
  };

  const handlePrintPDF = () => {
    try {
      printOrdersPDF(filtered);
      toast.success("تم فتح كشوفات الشحن والفواتير للطباعة و PDF! 🖨️");
    } catch (err: any) {
      toast.error(err.message || "فشل فتح نافذة الطباعة والتصدير");
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">إدارة الطلبات</h1>
          <p className="text-zinc-400 text-xs mt-1">
            {orders.length} طلب إجمالاً ({filtered.length} طلب معروض) — اضغط على أي طلب لعرض تفاصيله
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleAutoShip()}
            disabled={autoShippingAll}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            title="تشغيل بوت الشحن أوتوماتيكياً على موقع وصّلها لجميع الطلبات المؤكدة"
          >
            <Truck size={16} className={autoShippingAll ? "animate-bounce" : ""} />
            <span>{autoShippingAll ? "جارٍ الشحن..." : "شحن المؤكدة عبر البوت 🚀"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            title="تصدير جميع الطلبات المفلترة إلى Excel"
          >
            <FileSpreadsheet size={16} />
            <span>تصدير لـ Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            title="طباعة كشوفات الشحن وتصدير فواتير PDF"
          >
            <Printer size={16} />
            <span>طباعة / تصدير PDF</span>
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.value === "all"
              ? orders.length
              : orders.filter((o) => o.status === tab.value).length;
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10"
                  : "bg-white border border-zinc-100 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900"
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  isActive ? "bg-white/20 text-white" : "bg-zinc-50 text-zinc-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="بحث بالاسم، رقم الهاتف، أو رقم الطلب..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-3 border border-zinc-100 rounded-xl text-xs bg-white focus:outline-none focus:border-zinc-300 focus:ring-1 focus:ring-zinc-200/50 shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-all placeholder:text-zinc-400"
        />
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Spinner size="lg" />
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">جارٍ تحميل الطلبات...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100/80 p-16 text-center text-zinc-400 text-xs font-medium">
          لا توجد طلبات مطابقة للفلتر
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.015)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4 text-right">رقم الطلب</th>
                  <th className="px-6 py-4 text-right">العميل</th>
                  <th className="px-6 py-4 text-right">التاريخ</th>
                  <th className="px-6 py-4 text-right">الإجمالي</th>
                  <th className="px-6 py-4 text-right">الدفع</th>
                  <th className="px-6 py-4 text-right">الحالة</th>
                  <th className="px-6 py-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-zinc-50/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4 font-mono text-xs text-zinc-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        #{order.id.slice(0, 8).toUpperCase()}
                        {order.transferScreenshot && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" title="يوجد إيصال تحويل" />
                        )}
                        {order.trackingNumber && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500" title={`بوليصة: ${order.trackingNumber}`} />
                        )}
                        {order.shippingError && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="خطأ في الشحن" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-zinc-900">{order.customerName || "—"}</p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{order.phone || order.customerPhone || "—"}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500 font-medium">
                      {formatDate(
                        order.createdAt instanceof Date
                          ? order.createdAt
                          : (order.createdAt as { toDate(): Date }).toDate()
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-zinc-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-zinc-600">
                      {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-800">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDots[order.status] || "bg-zinc-300"}`} />
                        {ORDER_STATUS_LABELS[order.status]}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {STATUS_NEXT[order.status].length > 0 ? (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleStatusChange(order.id, e.target.value as OrderStatus);
                              }
                            }}
                            className="text-[10px] font-bold border border-zinc-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-zinc-300 bg-white cursor-pointer hover:bg-zinc-50 transition-all"
                            disabled={updatingId === order.id}
                          >
                            <option value="">تغيير</option>
                            {STATUS_NEXT[order.status].map((s) => (
                              <option key={s} value={s}>
                                {ORDER_STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] text-zinc-300 font-bold">مغلق</span>
                        )}
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف الطلب"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-100"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 sticky top-0 bg-white z-10" dir="rtl">
                <div>
                  <h3 className="font-black text-sm text-zinc-900 uppercase tracking-widest">
                    تفاصيل الطلب
                  </h3>
                  <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                    #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-100 text-zinc-400 hover:text-zinc-900 transition-all"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6" dir="rtl">
                {/* Status bar */}
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusDots[selectedOrder.status] || "bg-zinc-300"}`} />
                    <span className="text-xs font-bold text-zinc-800">
                      الحالة الحالية: {ORDER_STATUS_LABELS[selectedOrder.status]}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {formatDate(
                      selectedOrder.createdAt instanceof Date
                        ? selectedOrder.createdAt
                        : (selectedOrder.createdAt as { toDate(): Date }).toDate()
                    )}
                  </span>
                </div>

                {/* Customer Details with Quick Copy Buttons */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Sparkles size={11} /> بيانات العميل والشحن
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleCopyFullShippingData(selectedOrder)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 self-start sm:self-auto"
                    >
                      <Copy size={13} className="text-amber-400" />
                      <span>نسخ كافة بيانات الشحن لشركة الشحن 🚚</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white border border-zinc-100 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.005)]">
                    <div>
                      <p className="text-zinc-400 font-medium text-[11px]">الاسم</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="font-bold text-zinc-900">{selectedOrder.customerName}</p>
                        <button
                          type="button"
                          onClick={() => handleCopyText(selectedOrder.customerName, "اسم العميل")}
                          className="p-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
                          title="نسخ الاسم"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-zinc-400 font-medium text-[11px]">الهاتف الأساسي</p>
                      <div className="flex items-center gap-2 mt-0.5 font-mono">
                        <p className="font-bold text-zinc-900">{selectedOrder.phone}</p>
                        <button
                          type="button"
                          onClick={() => handleCopyText(selectedOrder.phone, "رقم الهاتف الأساسي")}
                          className="p-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
                          title="نسخ الرقم"
                        >
                          <Copy size={12} />
                        </button>
                        <a
                          href={`https://wa.me/${selectedOrder.phone.replace(/^0/, "20")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-green-600 hover:text-green-700"
                          title="فتح واتساب"
                        >
                          <MessageCircle size={14} />
                        </a>
                      </div>
                    </div>

                    <div>
                      <p className="text-zinc-400 font-medium text-[11px]">رقم الهاتف الثاني (البديل)</p>
                      <div className="flex items-center gap-2 mt-0.5 font-mono">
                        <p className="font-bold text-zinc-900">{selectedOrder.secondaryPhone || "غير مدخل"}</p>
                        {selectedOrder.secondaryPhone && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCopyText(selectedOrder.secondaryPhone, "رقم الهاتف البديل")}
                              className="p-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
                              title="نسخ الرقم البديل"
                            >
                              <Copy size={12} />
                            </button>
                            <a
                              href={`https://wa.me/${selectedOrder.secondaryPhone.replace(/^0/, "20")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-green-600 hover:text-green-700"
                              title="فتح واتساب البديل"
                            >
                              <MessageCircle size={14} />
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-zinc-400 font-medium text-[11px]">المحافظة والمنطقة</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="font-bold text-zinc-900">
                          {selectedOrder.governorate || "—"} ({selectedOrder.city})
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopyText(`${selectedOrder.governorate || ""} - ${selectedOrder.city}`, "المحافظة والمنطقة")}
                          className="p-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
                          title="نسخ المحافظة والمنطقة"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-zinc-400 font-medium text-[11px]">طريقة الدفع</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="font-bold text-zinc-900">
                          {PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopyText(PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod] || selectedOrder.paymentMethod, "طريقة الدفع")}
                          className="p-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
                          title="نسخ طريقة الدفع"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      {selectedOrder.transferPhone && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800 w-fit">
                          <span className="font-semibold">رقم التحويل:</span>
                          <span className="font-mono font-black select-all">{selectedOrder.transferPhone}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(selectedOrder.transferPhone!, "رقم التحويل")}
                            className="p-0.5 rounded text-purple-600 hover:text-purple-900 transition-colors"
                            title="نسخ رقم التحويل"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-zinc-400 font-medium text-[11px]">المبلغ الإجمالي (شامل الشحن)</p>
                      <div className="flex items-center gap-2 mt-0.5 font-mono">
                        <p className="font-extrabold text-amber-600">{selectedOrder.total} ج.م</p>
                        <button
                          type="button"
                          onClick={() => handleCopyText(`${selectedOrder.total} ج.م`, "المبلغ الإجمالي")}
                          className="p-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
                          title="نسخ المبلغ الإجمالي"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-2 border-t border-zinc-50 pt-3">
                      <p className="text-zinc-400 font-medium text-[11px]">العنوان بالتفصيل</p>
                      <div className="flex items-start justify-between gap-2 mt-0.5">
                        <p className="font-bold text-zinc-800 leading-relaxed">{selectedOrder.address}</p>
                        <button
                          type="button"
                          onClick={() => handleCopyText(selectedOrder.address, "العنوان بالتفصيل")}
                          className="p-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors shrink-0"
                          title="نسخ العنوان"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>

                    {selectedOrder.notes && (
                      <div className="sm:col-span-2 border-t border-zinc-50 pt-3">
                        <p className="text-zinc-400 font-medium text-[11px]">ملاحظات الطلب</p>
                        <div className="flex items-start justify-between gap-2 mt-0.5">
                          <p className="font-bold text-zinc-700 italic">&ldquo;{selectedOrder.notes}&rdquo;</p>
                          <button
                            type="button"
                            onClick={() => handleCopyText(selectedOrder.notes!, "ملاحظات الطلب")}
                            className="p-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors shrink-0"
                            title="نسخ الملاحظات"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* WhatsApp Confirmation Message (Design 1) Card */}
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 shadow-[0_4px_20px_rgba(16,185,129,0.04)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-emerald-600/20">
                        WA
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-emerald-950">
                          رسالة تأكيد الطلب (التصميم 1 🛍️)
                        </h4>
                        <p className="text-[10px] font-medium text-emerald-700">
                          تحتوي التفاصيل كاملة + رد 1 للتأكيد أو 2 للإلغاء
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyWhatsAppMessage(selectedOrder)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 hover:border-emerald-400 text-emerald-800 rounded-xl text-xs font-bold transition-all shadow-sm"
                        title="نسخ نص الرسالة"
                      >
                        {copiedWaMsg ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        {copiedWaMsg ? "تم النسخ" : "نسخ النص"}
                      </button>
                      <button
                        onClick={() => handleSendWhatsAppConfirmation(selectedOrder)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                        title="إرسال عبر الواتساب مباشرة"
                      >
                        <MessageCircle size={13} />
                        إرسال عبر واتساب
                      </button>
                    </div>
                  </div>
                  <div className="bg-white/90 border border-emerald-100 rounded-xl p-3.5 text-xs text-emerald-950 font-mono whitespace-pre-wrap leading-relaxed select-all max-h-48 overflow-y-auto">
                    {buildWhatsAppConfirmationMessage(selectedOrder, "LUNO")}
                  </div>
                </div>

                {/* Shipping Tracking Section */}
                <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.04)]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                      <Truck size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-indigo-950">
                        بيانات الشحن والتتبع
                      </h4>
                      <p className="text-[10px] font-medium text-indigo-600">
                        {selectedOrder.trackingNumber ? "تم تسجيل الشحنة ✅" : "لم يتم تسجيل الشحنة بعد"}
                      </p>
                    </div>
                  </div>

                  {/* Shipping Error Alert */}
                  {selectedOrder.shippingError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-3 text-xs text-red-800">
                      <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">خطأ في التسجيل التلقائي:</p>
                        <p className="mt-0.5 font-mono text-[10px]">{selectedOrder.shippingError}</p>
                      </div>
                    </div>
                  )}

                  {selectedOrder.trackingNumber ? (
                    /* Tracking Number Display */
                    <div className="bg-white/90 border border-indigo-100 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">رقم البوليصة / التتبع</p>
                          <p className="text-lg font-black text-indigo-900 font-mono mt-1 select-all">
                            {selectedOrder.trackingNumber}
                          </p>
                          <p className="text-[10px] text-indigo-400 mt-1">
                            الشركة: {selectedOrder.shippingProvider === "egypt_post" ? "بريد مصر (وصّلها)" : selectedOrder.shippingProvider === "manual" ? "إدخال يدوي" : selectedOrder.shippingProvider || "غير محدد"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText(selectedOrder.trackingNumber!, "رقم التتبع")}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                        >
                          <Copy size={13} />
                          نسخ رقم التتبع
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Manual Tracking Input & Auto-Ship Option */
                    <div className="bg-white/90 border border-indigo-100 rounded-xl p-4 space-y-3">
                      {/* Auto-Ship Option */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                        <div>
                          <p className="text-xs font-black text-indigo-950 flex items-center gap-1">
                            <Truck size={13} className="text-indigo-600" />
                            الشحن التلقائي (بوت وصّلها)
                          </p>
                          <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                            فتح متصفح وصّلها وتعبئة البيانات واستخراج رقم البوليصة تلقائياً
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAutoShip(selectedOrder.id)}
                          disabled={autoShippingId === selectedOrder.id}
                          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0"
                        >
                          <Truck size={13} className={autoShippingId === selectedOrder.id ? "animate-spin" : ""} />
                          {autoShippingId === selectedOrder.id ? "جارٍ الشحن..." : "شحن تلقائي 🚀"}
                        </button>
                      </div>

                      {/* Manual Input Alternative */}
                      <div>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mb-2">
                          <Package size={11} className="inline ml-1" />
                          أو إدخال رقم التتبع يدوياً
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="أدخل رقم البوليصة هنا..."
                            value={manualTracking}
                            onChange={(e) => setManualTracking(e.target.value)}
                            className="flex-1 px-3.5 py-2.5 border border-indigo-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200/50 placeholder:text-indigo-300"
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveManualTracking(selectedOrder.id)}
                            disabled={!manualTracking.trim() || savingTracking}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                          >
                            <Check size={13} />
                            {savingTracking ? "جارٍ الحفظ..." : "حفظ"}
                          </button>
                        </div>
                        <p className="text-[10px] text-indigo-400 mt-2">
                          💡 سيتم تحويل حالة الطلب تلقائياً إلى &quot;جارٍ الشحن&quot; بعد الشحن أو الحفظ
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Transfer Screenshot */}

                {selectedOrder.transferScreenshot && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                      <Sparkles size={11} /> إيصال التحويل
                    </h4>
                    <div className="border border-zinc-100 rounded-2xl overflow-hidden">
                      <img
                        src={selectedOrder.transferScreenshot}
                        alt="إيصال التحويل"
                        className="w-full max-h-64 object-contain bg-zinc-50"
                      />
                      <div className="flex items-center gap-2 p-3 bg-white border-t border-zinc-100">
                        <a
                          href={selectedOrder.transferScreenshot}
                          download="transfer-receipt.jpg"
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-400 px-3 py-1.5 rounded-lg transition-all"
                        >
                          <Download size={13} />
                          تحميل
                        </a>
                        <button
                          onClick={() => handleWhatsAppScreenshot(selectedOrder)}
                          className="flex items-center gap-1.5 text-xs font-bold text-green-700 hover:text-green-900 border border-green-200 hover:border-green-400 px-3 py-1.5 rounded-lg transition-all"
                        >
                          <MessageCircle size={13} />
                          إرسال واتساب
                        </button>
                        <button
                          onClick={() => handleDeleteScreenshot(selectedOrder)}
                          disabled={deletingScreenshot}
                          className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-all mr-auto"
                        >
                          <ImageOff size={13} />
                          {deletingScreenshot ? "جارٍ المسح..." : "مسح الصورة"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                    <Sparkles size={11} />
                    المنتجات ({selectedOrder.items.reduce((sum, item) => sum + item.quantity, 0)})
                  </h4>
                  <div className="space-y-2.5">
                    {selectedOrder.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3.5 p-3.5 bg-zinc-50/50 border border-zinc-100 rounded-2xl"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-zinc-100 flex-shrink-0 flex items-center justify-center p-1">
                          {item.productImage ? (
                            <Image
                              src={item.productImage}
                              alt={item.productName}
                              width={40}
                              height={40}
                              className="object-contain"
                            />
                          ) : (
                            <div className="text-[10px] font-black text-zinc-300">LUNO</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-zinc-950 truncate">{item.productName}</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                            اللون: {item.selectedColor?.name || "افتراضي"} | المقاس: {item.selectedSize || "قياسي"} | الكمية: {item.quantity || 1}
                          </p>
                        </div>
                        <p className="font-black text-xs text-zinc-950">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-zinc-100">
                  <div>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">الإجمالي الكلي</p>
                    <p className="text-2xl font-black text-zinc-900 tracking-tight mt-0.5">
                      {formatPrice(selectedOrder.total)}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap items-center">
                    <button
                      onClick={() => handleDeleteOrder(selectedOrder.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={14} />
                      حذف الطلب
                    </button>
                    {STATUS_NEXT[selectedOrder.status].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(selectedOrder.id, s)}
                        disabled={updatingId === selectedOrder.id}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${
                          s === "cancelled"
                            ? "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                            : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-900/10"
                        }`}
                      >
                        تحويل إلى: {ORDER_STATUS_LABELS[s]}
                        <ChevronRight size={12} />
                      </button>
                    ))}
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
