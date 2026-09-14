"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight, Gift, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/features/cart/CartProvider";
import { useBundleDiscount } from "@/hooks/useBundleDiscount";
import { formatPrice } from "@/lib/utils";

import { useProductModal } from "@/features/product-modal/ProductModalProvider";

export function CartSidebar() {
  const router = useRouter();
  const { isOpen, closeCart, items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();
  const { closeProduct } = useProductModal();
  const {
    bundleEnabled,
    totalDiscount,
    showUpsell,
    remainingForNext,
    discountPerBundle,
    bundleMessage,
    finalPrice,
  } = useBundleDiscount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const handleGoToCheckout = () => {
    closeCart();
    closeProduct();
    router.push("/checkout");
  };

  const handleBrowseMore = () => {
    closeCart();
    closeProduct();
    router.push("/#products");
  };

  // createPortal mounts directly into document.body (outside ALL React tree contexts)
  // This is the ONLY fix for iOS Safari position:fixed scroll bug
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 99998 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm sm:max-w-md bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col shadow-2xl border-l border-zinc-200 dark:border-zinc-800"
            style={{ zIndex: 99999 }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-950">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={20} />
                <h2 className="font-extrabold text-sm uppercase tracking-wider">سلة الشراء</h2>
                {totalItems > 0 && (
                  <span className="bg-black text-white dark:bg-white dark:text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                    {totalItems}
                  </span>
                )}
              </div>
              <button type="button" onClick={closeCart} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400">
                    <ShoppingBag size={28} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">سلة الشراء فارغة</p>
                    <p className="text-xs text-zinc-400 mt-1">أضف منتجاتك المفضلة لبدء التسوق الآن</p>
                  </div>
                  <button type="button" onClick={() => { closeCart(); closeProduct(); router.push("/shop"); }} className="px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer">
                    تصفح المنتجات
                  </button>
                </div>
              ) : (
                <>
                  {items.map((item, index) => {
                    const pId = item.product?.id || `item-${index}`;
                    const pSize = item.selectedSize || "قياسي";
                    const pColorHex = item.selectedColor?.hex || "#000000";
                    const pColorName = item.selectedColor?.name || "افتراضي";
                    const pImage = item.selectedColor?.image || item.product?.mainImage || "/placeholder.jpg";
                    const pName = item.product?.name || "منتج Luno Store";
                    const price = item.product?.salePrice ?? item.product?.price ?? 0;
                    const key = `${pId}-${pSize}-${pColorHex}`;

                    return (
                      <motion.div key={key} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 flex-shrink-0 p-1 border border-zinc-200/60 dark:border-zinc-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={pImage} alt={pName} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-xs truncate">{pName}</h4>
                            <button type="button" onClick={() => removeItem(pId, pSize, pColorHex)} className="text-zinc-400 hover:text-red-500 transition-colors p-0.5 cursor-pointer flex-shrink-0"><Trash2 size={14} /></button>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full border border-zinc-300 dark:border-zinc-700" style={{ backgroundColor: pColorHex }} />
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">{pColorName}</span>
                            </div>
                            <span className="text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 rounded">{pSize}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-black">{formatPrice(price * (item.quantity || 1))}</span>
                            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 shadow-sm">
                              <button type="button" onClick={() => updateQuantity(pId, pSize, pColorHex, (item.quantity || 1) - 1)} className="w-4 h-4 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded cursor-pointer"><Minus size={10} /></button>
                              <span className="text-xs font-bold w-4 text-center">{item.quantity || 1}</span>
                              <button type="button" onClick={() => updateQuantity(pId, pSize, pColorHex, (item.quantity || 1) + 1)} className="w-4 h-4 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded cursor-pointer"><Plus size={10} /></button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* ── Upsell Banner ── */}
                  <AnimatePresence>
                    {showUpsell && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="relative overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 p-3.5"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center flex-shrink-0">
                            <Gift size={16} className="text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-emerald-800 dark:text-emerald-200 leading-relaxed">
                              {bundleMessage || `ضيف ${remainingForNext === 1 ? "قطعة كمان" : `${remainingForNext} قطع كمان`} ووفّر ${formatPrice(discountPerBundle)}! 🔥`}
                            </p>
                            <button
                              type="button"
                              onClick={handleBrowseMore}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              <Sparkles size={11} />
                              تصفح المنتجات
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Pinned Footer */}
            {items.length > 0 && (
              <div className="px-5 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-shrink-0 space-y-3">
                {/* Subtotal */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">المجموع</span>
                  <span className={`font-black text-base ${totalDiscount > 0 ? "line-through text-zinc-400 dark:text-zinc-500 text-sm" : ""}`}>
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                {/* Bundle Discount Line */}
                <AnimatePresence>
                  {totalDiscount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Gift size={12} />
                          خصم العرض
                        </span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">- {formatPrice(totalDiscount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1.5 pt-1.5 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="text-zinc-700 dark:text-zinc-200 font-black uppercase tracking-wider">بعد الخصم</span>
                        <span className="font-black text-base text-emerald-700 dark:text-emerald-300">{formatPrice(finalPrice)}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={handleGoToCheckout}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold text-xs hover:opacity-90 transition-all shadow-lg cursor-pointer"
                >
                  <span>إتمام الشراء الآن</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
