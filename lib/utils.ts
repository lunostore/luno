import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency = "EGP"): string {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function generateSlug(name: string): string {
  if (!name) return `product-${Date.now().toString(36)}`;
  
  // Keep English alphanumeric, Arabic letters, spaces, hyphens
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0600-\u06FF-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  if (!cleaned || cleaned === "-") {
    return `product-${Date.now().toString(36)}`;
  }
  return cleaned;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getDiscountPercentage(price: number, salePrice: number): number {
  return Math.round(((price - salePrice) / price) * 100);
}

export function formatDate(date: Date | { toDate(): Date }): string {
  const d = date instanceof Date ? date : date.toDate();
  return new Intl.DateTimeFormat("en-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/** Generates a unique product SKU like LUNO-A4K2 */
export function generateSKU(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `LUNO-${code}`;
}

/** Generates Design 1 WhatsApp Order Confirmation message with 1/2 options */
export function buildWhatsAppConfirmationMessage(
  order: {
    id: string;
    customerName: string;
    phone: string;
    governorate?: string;
    city: string;
    address: string;
    items: Array<{
      productName: string;
      quantity: number;
      price: number;
      selectedSize?: string;
      selectedColor?: { name: string };
    }>;
    subtotal?: number;
    shippingCost?: number;
    total: number;
  },
  storeName = "MYZ"
): string {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const itemsText = order.items
    .map(
      (item) =>
        `- ${item.productName}${item.selectedSize ? ` (${item.selectedSize})` : ""}${
          item.selectedColor?.name ? ` - ${item.selectedColor.name}` : ""
        } (الكمية: ${item.quantity}) - ${formatPrice(item.price * item.quantity)}`
    )
    .join("\n");

  const fullAddress = [order.governorate, order.city, order.address]
    .filter(Boolean)
    .join(" - ");

  const subtotalText = order.subtotal ? formatPrice(order.subtotal) : formatPrice(order.total);
  const shippingText =
    order.shippingCost !== undefined ? formatPrice(order.shippingCost) : "حسب المحافظة";
  const totalText = formatPrice(order.total);

  return `مرحبا ${order.customerName}
شكرا لطلبك من ${storeName}!

تفاصيل طلبك:
-----------------------------------
رقم الطلب: #${shortId}

المنتجات:
${itemsText}

بيانات التوصيل:
- الاسم: ${order.customerName}
- الهاتف: ${order.phone}
- العنوان: ${fullAddress}

الفاتورة:
- مجموع المنتجات: ${subtotalText}
- مصاريف الشحن: ${shippingText}
- الاجمالي النهائي: ${totalText}
-----------------------------------

لتجهيز طلبك وتسليمه لشركة الشحن فورا، نرجو تأكيد الطلب:

(1) تأكيد الطلب - للبدء في التغليف والشحن
(2) الغاء الطلب

من فضلك أرسل الرقم (1) للتأكيد أو (2) للالغاء.`;
}

