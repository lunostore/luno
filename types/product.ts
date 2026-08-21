import { Timestamp } from "firebase/firestore";

export interface CustomSizeChart {
  id: string;
  name: string;
  imageUrl: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;       // كود فريد للمنتج مثل LUNO-AB12 — يُدمج في رابط المنتج
  description: string;
  subtitle?: string;   // وصف فرعي كارت المنتج مثل Premium Oversized Fit
  price: number;
  salePrice?: number;
  category: string;
  brand: string;
  mainImage: string;
  hoverImage?: string; // صورة الهوفر الثانية المعروضة عند تمرير الماوس
  imageScale?: number; // مقياس حجم الصورة بالنسبة المئوية (مثلاً 100% أو 120%)
  imageOffsetY?: number; // إزاحة الصورة عمودياً بالبكسل
  images?: string[];   // معرض الصور الإضافية
  detailImages?: string[]; // صور إضافية قديمة
  material?: string;   // الخامة مثل 100% Cotton
  weight?: string;     // الوزن/الخامة مثل 230 GSM
  fit?: string;        // القصة مثل Unisex / Boxy Fit
  variants: ProductVariant[];
  featured: boolean;
  bestSeller: boolean;
  isNew?: boolean;     // شارة NEW للمنتجات الجديدة
  sizeChartType?: string; // دعم توافقي قديم
  sizeChartId?: string;   // معرف جدول المقاسات المخصص
  sizeChartUrl?: string;  // رابط صورة جدول المقاسات المخصص
  createdAt: Timestamp | Date;
}


export interface ProductVariant {
  colorName: string;
  colorHex: string;
  image: string; // Primary Cloudinary URL for this specific color
  images?: string[]; // Multiple Cloudinary URLs for this specific color variant
  sizes: SizeStock[]; // Specific sizes and stock levels for this color
}

export interface SizeStock {
  size: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: {
    name: string;
    hex: string;
    image: string;
  };
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  featured?: boolean;
  bestSeller?: boolean;
}
