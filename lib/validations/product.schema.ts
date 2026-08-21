import { z } from "zod";

export const sizeStockSchema = z.object({
  size: z.string().min(1, "Size is required"),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or more"),
});

export const productVariantSchema = z.object({
  colorName: z.string().min(1, "Color name is required"),
  colorHex: z.string().default("#000000"),
  image: z.string().default(""),
  images: z.array(z.string()).optional(),
  sizes: z.array(sizeStockSchema).min(1, "At least one size is required"),
});

export const productSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  slug: z.string().min(1, "الرابط مطلوب"),
  sku: z.string().min(1, "الكود مطلوب"),
  description: z.string().optional().default(""),
  price: z.coerce.number().min(0, "السعر يجب أن يكون رقماً موجباً"),
  salePrice: z.coerce.number().optional(),
  category: z.string().min(1, "اختر الفئة"),
  brand: z.string().default("LUNO"),
  mainImage: z.string().min(1, "صورة الغلاف الرئيسية مطلوبة"),
  hoverImage: z.string().optional().or(z.literal("")),
  imageScale: z.coerce.number().optional().default(100),
  imageOffsetY: z.coerce.number().optional().default(0),
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
