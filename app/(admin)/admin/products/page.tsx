"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Save,
  CheckCircle2,
  Sparkles,
  LayoutGrid,
  RotateCcw,
} from "lucide-react";
import {
  deleteProduct,
  subscribeToProducts,
  updateProductSortOrders,
} from "@/lib/firebase/firestore";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types/product";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Reorder Mode State ──
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderedList, setReorderedList] = useState<Product[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data);
      setFiltered(data);
      setReorderedList(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      products.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const cat = (p.category || "").toLowerCase();
        const brand = (p.brand || "").toLowerCase();
        return name.includes(q) || cat.includes(q) || brand.includes(q);
      })
    );
  }, [search, products]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteId);
      toast.success("تم حذف المنتج بنجاح");
      setDeleteId(null);
    } catch {
      toast.error("فشل حذف المنتج");
    } finally {
      setDeleting(false);
    }
  };

  // ── Reorder Actions ──
  const moveItem = (index: number, direction: "up" | "down" | "top" | "bottom") => {
    const list = [...reorderedList];
    const target = list[index];
    if (!target) return;

    if (direction === "up" && index > 0) {
      list.splice(index, 1);
      list.splice(index - 1, 0, target);
    } else if (direction === "down" && index < list.length - 1) {
      list.splice(index, 1);
      list.splice(index + 1, 0, target);
    } else if (direction === "top") {
      list.splice(index, 1);
      list.unshift(target);
    } else if (direction === "bottom") {
      list.splice(index, 1);
      list.push(target);
    }

    setReorderedList(list);
    setHasUnsavedOrder(true);
  };

  // Quick Presets
  const applyPreset = (type: "newest" | "price-high" | "price-low" | "alphabetical") => {
    const list = [...reorderedList];
    if (type === "newest") {
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
        return timeB - timeA;
      });
    } else if (type === "price-high") {
      list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
    } else if (type === "price-low") {
      list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    } else if (type === "alphabetical") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    setReorderedList(list);
    setHasUnsavedOrder(true);
    toast.info("تم تطبيق القالب المسبق. لا تنسى الضغط على حفظ الترتيب.");
  };

  // Save new order to Firestore
  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const orderedIds = reorderedList.map((p) => p.id);
      await updateProductSortOrders(orderedIds);
      setHasUnsavedOrder(false);
      toast.success("تم حفظ وتحديث ترتيب المنتجات على المتجر بنجاح! 🚀");
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء حفظ الترتيب");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const resetToCurrent = () => {
    setReorderedList(products);
    setHasUnsavedOrder(false);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 flex items-center gap-2.5">
            <span>المنتجات</span>
            <span className="text-xs bg-zinc-100 text-zinc-600 font-bold px-2.5 py-1 rounded-full">
              {products.length} منتج
            </span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            إدارة الكتالوج وترتيب ظهور المنتجات على الصفحة الرئيسية وقسم المتجر
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Reorder Mode Switcher */}
          <button
            type="button"
            onClick={() => {
              setIsReorderMode(!isReorderMode);
              if (!isReorderMode) setReorderedList(products);
            }}
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all duration-300 shadow-sm cursor-pointer ${
              isReorderMode
                ? "bg-amber-500 text-white shadow-amber-500/20 ring-2 ring-amber-400/40"
                : "bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200"
            }`}
          >
            <ArrowUpDown size={14} />
            <span>{isReorderMode ? "الرجوع لعرض الجدول" : "🔀 ترتيب المنتجات على الموقع"}</span>
          </button>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 bg-zinc-900 text-white px-5 py-3 rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all duration-300 shadow-md shadow-zinc-900/10"
          >
            <Plus size={14} />
            <span>إضافة منتج جديد</span>
          </Link>
        </div>
      </div>

      {/* ── REORDER MODE VIEW ── */}
      {isReorderMode ? (
        <div className="space-y-6">
          {/* Reorder Action Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 dark:border-amber-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-600" />
                <h3 className="font-black text-sm text-zinc-900">
                  لوحة الترتيب اليدوي لكروت المنتجات
                </h3>
              </div>
              <p className="text-xs text-zinc-600">
                المنتج رقم 1 سيظهر كأول كارت على الهوم بيج وفي المتجر. استخدم الأسهم لتحريك المنتجات لأعلى أو لأسفل ثم اضغط حفظ.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              {hasUnsavedOrder && (
                <button
                  type="button"
                  onClick={resetToCurrent}
                  className="px-3.5 py-2.5 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>تراجع</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={isSavingOrder || !hasUnsavedOrder}
                className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingOrder ? (
                  <Spinner size="sm" className="border-white border-t-transparent" />
                ) : (
                  <>
                    <Save size={14} />
                    <span>حفظ الترتيب في المتجر</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Sorting Presets */}
          <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-zinc-500">ترتيب سريع مسبق:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset("newest")}
                className="text-[11px] font-bold bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg text-zinc-700 transition-colors cursor-pointer"
              >
                ⚡ الأحدث أولاً
              </button>
              <button
                type="button"
                onClick={() => applyPreset("price-high")}
                className="text-[11px] font-bold bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg text-zinc-700 transition-colors cursor-pointer"
              >
                💎 الأعلى سعراً
              </button>
              <button
                type="button"
                onClick={() => applyPreset("price-low")}
                className="text-[11px] font-bold bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg text-zinc-700 transition-colors cursor-pointer"
              >
                🏷️ الأقل سعراً
              </button>
              <button
                type="button"
                onClick={() => applyPreset("alphabetical")}
                className="text-[11px] font-bold bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg text-zinc-700 transition-colors cursor-pointer"
              >
                🔤 أبجدياً (A-Z)
              </button>
            </div>
          </div>

          {/* Reorder Items List */}
          <div className="space-y-3">
            {reorderedList.map((product, index) => {
              const isFirst = index === 0;
              const isLast = index === reorderedList.length - 1;
              return (
                <motion.div
                  key={product.id}
                  layout
                  className={`bg-white rounded-2xl border p-3.5 sm:p-4 shadow-sm flex items-center justify-between gap-3 sm:gap-6 transition-all ${
                    index === 0
                      ? "border-amber-400 bg-amber-50/20"
                      : index === 1
                      ? "border-zinc-300 bg-zinc-50/30"
                      : "border-zinc-100 hover:border-zinc-200"
                  }`}
                >
                  {/* Rank Badge & Product Info */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm font-mono flex-shrink-0 shadow-sm ${
                        index === 0
                          ? "bg-amber-500 text-white"
                          : index === 1
                          ? "bg-zinc-700 text-white"
                          : index === 2
                          ? "bg-amber-700 text-white"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      #{index + 1}
                    </span>

                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 flex-shrink-0 flex items-center justify-center p-1.5">
                      {product.mainImage ? (
                        <Image
                          src={product.mainImage}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <div className="text-[10px] text-zinc-300 font-black">LUNO</div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-zinc-950 truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-zinc-400 font-medium uppercase">
                          {product.category}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-black">
                          {formatPrice(product.salePrice ?? product.price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ordering Arrow Controls */}
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveItem(index, "top")}
                      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-zinc-50 hover:bg-zinc-100 disabled:opacity-25 border border-zinc-200/70 text-zinc-600 transition-all cursor-pointer"
                      title="نقل للأول تماماً"
                    >
                      <ChevronsUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveItem(index, "up")}
                      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-zinc-50 hover:bg-zinc-100 disabled:opacity-25 border border-zinc-200/70 text-zinc-700 transition-all cursor-pointer"
                      title="تحريك لأعلى"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveItem(index, "down")}
                      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-zinc-50 hover:bg-zinc-100 disabled:opacity-25 border border-zinc-200/70 text-zinc-700 transition-all cursor-pointer"
                      title="تحريك لأسفل"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveItem(index, "bottom")}
                      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-zinc-50 hover:bg-zinc-100 disabled:opacity-25 border border-zinc-200/70 text-zinc-600 transition-all cursor-pointer"
                      title="نقل للآخر تماماً"
                    >
                      <ChevronsDown size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Sticky Bottom Save Button */}
          {hasUnsavedOrder && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky bottom-6 z-40 bg-zinc-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 border border-zinc-800"
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 size={16} className="text-amber-400 animate-pulse" />
                <span>لديك تغييرات في ترتيب المنتجات لم تُحفظ بعد</span>
              </div>
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={isSavingOrder}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                {isSavingOrder ? <Spinner size="sm" className="border-white border-t-transparent" /> : "حفظ الترتيب الآن"}
              </button>
            </motion.div>
          )}
        </div>
      ) : (
        /* ── STANDARD TABLE VIEW ── */
        <div className="space-y-6">
          {/* Search and Filters Bar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                placeholder="ابحث باسم المنتج، الماركة، أو القسم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-zinc-100 rounded-xl text-xs bg-white focus:outline-none focus:border-zinc-300 focus:ring-1 focus:ring-zinc-200/50 shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-all placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Main Table Container */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Spinner size="lg" />
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">
                جارٍ تحميل كتالوج المنتجات...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="لم يتم العثور على منتجات"
              description={
                search ? "جرب البحث بكلمة مفتاحية أخرى." : "قم بإضافة أول منتج للبدء."
              }
              action={
                !search ? (
                  <Link
                    href="/admin/products/new"
                    className="inline-flex items-center gap-2 bg-zinc-900 text-white px-5 py-3 rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all duration-300"
                  >
                    <Plus size={14} />
                    إضافة منتج جديد
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.015)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-50/50 border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="px-6 py-4 text-right"># الترتيب</th>
                      <th className="px-6 py-4 text-right">المنتج</th>
                      <th className="px-6 py-4 text-right">القسم</th>
                      <th className="px-6 py-4 text-right">السعر</th>
                      <th className="px-6 py-4 text-right">المخزون المتاح</th>
                      <th className="px-6 py-4 text-right">الشارات والتاجات</th>
                      <th className="px-6 py-4 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    <AnimatePresence initial={false}>
                      {filtered.map((product, i) => {
                        const totalStock =
                          product.variants?.reduce(
                            (sum, v) => sum + v.sizes.reduce((sSum, s) => sSum + s.stock, 0),
                            0
                          ) || 0;
                        return (
                          <motion.tr
                            key={product.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.2) }}
                            className="hover:bg-zinc-50/40 transition-colors"
                          >
                            {/* Order Rank */}
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 font-mono font-black text-xs text-zinc-700">
                                #{i + 1}
                              </span>
                            </td>

                            {/* Product details */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-50/60 border border-zinc-100 flex-shrink-0 flex items-center justify-center p-1.5">
                                  {product.mainImage ? (
                                    <Image
                                      src={product.mainImage}
                                      alt={product.name}
                                      width={40}
                                      height={40}
                                      className="object-contain w-full h-full"
                                    />
                                  ) : (
                                    <div className="text-[10px] text-zinc-300 font-black tracking-tighter">
                                      LUNO
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-zinc-950">{product.name}</p>
                                  <p className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase mt-0.5">
                                    {product.brand}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="px-6 py-4 text-xs font-semibold text-zinc-500 capitalize">
                              {product.category}
                            </td>

                            {/* Pricing */}
                            <td className="px-6 py-4 text-xs font-black text-zinc-950">
                              <div>
                                {product.salePrice ? (
                                  <div className="space-y-0.5">
                                    <p className="font-black text-zinc-950">
                                      {formatPrice(product.salePrice)}
                                    </p>
                                    <p className="text-[10px] text-zinc-400 line-through font-medium">
                                      {formatPrice(product.price)}
                                    </p>
                                  </div>
                                ) : (
                                  <p>{formatPrice(product.price)}</p>
                                )}
                              </div>
                            </td>

                            {/* Stock Level */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    totalStock === 0
                                      ? "bg-red-500"
                                      : totalStock <= 5
                                      ? "bg-amber-500"
                                      : "bg-green-500"
                                  }`}
                                />
                                <span className="text-xs font-bold text-zinc-800">
                                  {totalStock === 0 ? "نفذت الكمية" : `${totalStock} قطعة`}
                                </span>
                              </div>
                            </td>

                            {/* Status Badges */}
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {product.featured && (
                                  <span className="text-[9px] bg-zinc-900 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                    مميز
                                  </span>
                                )}
                                {product.bestSeller && (
                                  <span className="text-[9px] bg-zinc-100 text-zinc-800 border border-zinc-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                    الأكثر مبيعاً
                                  </span>
                                )}
                                {!product.featured && !product.bestSeller && (
                                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                                    عادية
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Action buttons */}
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/admin/products/edit?id=${product.id}`}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-100 transition-all text-zinc-500 hover:text-zinc-900"
                                  title="تعديل"
                                >
                                  <Edit size={13} />
                                </Link>
                                <button
                                  onClick={() => setDeleteId(product.id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition-all text-zinc-400 hover:text-red-600"
                                  title="حذف"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Drawer Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-zinc-100"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
            >
              <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center mb-4">
                <AlertTriangle className="text-red-500" size={18} />
              </div>
              <h3 className="font-black text-sm text-zinc-900 uppercase tracking-wider mb-2">
                حذف المنتج
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                هل أنت تأكد من رغبتك في حذف هذا المنتج؟ هذا الإجراء نهائي ولا يمكن التراجع عنه في
                قاعدة البيانات.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-xs font-bold hover:bg-zinc-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/10"
                >
                  {deleting ? (
                    <Spinner size="sm" className="border-white border-t-transparent" />
                  ) : (
                    "تأكيد الحذف"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
