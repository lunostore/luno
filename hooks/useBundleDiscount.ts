"use client";

import { useSiteSettings } from "@/features/settings/SiteSettingsProvider";
import { useCart } from "@/features/cart/CartProvider";
import { parseArabicNumber } from "@/lib/utils";

/**
 * Hook لحساب خصم الحزم (Bundle Discount) بناءً على إعدادات الأدمن ومحتويات السلة.
 *
 * المعادلة:
 *   أزواج = Math.floor(إجمالي_القطع / bundleQuantity)
 *   الخصم = أزواج × bundleDiscount
 */
export function useBundleDiscount() {
  const { settings } = useSiteSettings();
  const { totalItems, totalPrice } = useCart();

  const rawEnabled = settings?.bundleEnabled;
  const discountPerBundle = parseArabicNumber(settings?.bundleDiscount);
  const bundleQty = Math.max(2, parseArabicNumber(settings?.bundleQuantity) || 2);
  const bundleMessage = settings?.bundleMessage?.trim() || "";

  // العرض مفعّل إذا كان bundleEnabled = true، أو إذا وضع الأدمن خصماً أكبر من 0
  const bundleEnabled = rawEnabled === true || (rawEnabled !== false && discountPerBundle > 0);

  // عدد الحزم الكاملة (أزواج)
  const completedBundles = bundleEnabled && bundleQty > 0 && discountPerBundle > 0
    ? Math.floor(totalItems / bundleQty)
    : 0;

  // إجمالي الخصم
  const totalDiscount = completedBundles * discountPerBundle;

  // القطع المتبقية لإكمال الحزمة التالية
  const remainingForNext = bundleEnabled && bundleQty > 0
    ? bundleQty - (totalItems % bundleQty)
    : 0;

  // هل العميل يستحق رؤية رسالة Upsell؟ (عنده قطع لكن لم يكمل الحزمة التالية)
  const showUpsell = bundleEnabled
    && discountPerBundle > 0
    && totalItems > 0
    && (totalItems % bundleQty) !== 0;

  // هل العميل حصل على خصم حالياً؟
  const hasDiscount = totalDiscount > 0;

  // السعر النهائي بعد الخصم (بدون شحن)
  const finalPrice = Math.max(0, totalPrice - totalDiscount);

  return {
    bundleEnabled,
    bundleQty,
    discountPerBundle,
    completedBundles,
    totalDiscount,
    remainingForNext,
    showUpsell,
    hasDiscount,
    finalPrice,
    bundleMessage,
  };
}
