import { z } from "zod";

export const sizeStockSchema = z.object({
  size: z.string().min(1, "Size is required"),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or more").default(0),
});

export const productVariantSchema = z.object({
  colorName: z.string().min(1, "Color name is required"),
  colorHex: z.string().default("#000000"),
  image: z.string().or(z.literal("")).default(""),
  images: z.array(z.string()).optional().default([]),
  sizes: z.array(sizeStockSchema).min(1, "At least one size is required"),
});

export const productSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  slug: z.string().min(1, "الرابط مطلوب"),
  sku: z.string().min(1, "الكود مطلوب").default("LUNO-001"),
  description: z.string().optional().default(""),
  price: z.coerce.number().min(0, "السعر يجب أن يكون رقماً موجباً").default(0),
  salePrice: z.coerce.number().optional().nullable(),
  category: z.string().min(1, "اختر الفئة").default("t-shirts"),
  brand: z.string().default("LUNO"),
  mainImage: z.string().min(1, "صورة الغلاف الرئيسية مطلوبة"),
  hoverImage: z.string().optional().or(z.literal("")).default(""),
  images: z.array(z.string()).optional().default([]),
  subtitle: z.string().optional().default(""),
  detailImages: z.array(z.string()).optional().default([]),
  material: z.string().optional().default("100% Premium Cotton"),
  weight: z.string().optional().default("240 GSM"),
  fit: z.string().optional().default("Oversized Fit"),
  variants: z.array(productVariantSchema).min(1, "أضف لون واحد على الأقل"),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  sizeChartType: z.string().optional().default(""),
  sizeChartId: z.string().optional().default(""),
  sizeChartUrl: z.string().optional().default(""),
});

export type ProductFormData = z.infer<typeof productSchema>;
