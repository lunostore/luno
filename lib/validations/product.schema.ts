import { z } from "zod";

export const sizeStockSchema = z.object({
  size: z.string().min(1, "Size is required"),
  stock: z.number().int().min(0, "Stock must be 0 or more"),
});

export const productVariantSchema = z.object({
  colorName: z.string().min(1, "Color name is required"),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Valid hex color required"),
  image: z.string().or(z.literal("")).default(""),
  images: z.array(z.string()).optional(),
  sizes: z.array(sizeStockSchema).min(1, "At least one size is required"),
});

export const productSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "الرابط يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطة فقط"),
  sku: z.string().min(3, "الكود مطلوب").max(20, "الكود طويل جداً"),
  description: z.string().min(10, "الوصف يجب أن يكون 10 أحرف على الأقل"),
  price: z.number().min(0, "السعر يجب أن يكون موجباً"),
  salePrice: z.number().min(0).optional(),
  category: z.string().min(1, "اختر الفئة"),
  brand: z.string().min(1, "البراند مطلوب"),
  mainImage: z.string().url("صورة الغلاف الرئيسية مطلوبة"),
  hoverImage: z.string().url("رابط الصورة غير صحيح").or(z.literal("")).optional(),
  images: z.array(z.string()).optional(),
  subtitle: z.string().optional(),
  detailImages: z.array(z.string()).optional(),
  material: z.string().optional(),
  weight: z.string().optional(),
  fit: z.string().optional(),
  variants: z.array(productVariantSchema).min(1, "أضف لون واحد على الأقل"),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  sizeChartType: z.string().optional(),
  sizeChartId: z.string().optional(),
  sizeChartUrl: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
