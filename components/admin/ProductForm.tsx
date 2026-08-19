"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X, Upload, Trash2, Palette, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createProduct, updateProduct, extractProductImages, getSiteSettings } from "@/lib/firebase/firestore";
import { generateSlug, generateSKU } from "@/lib/utils";
import { productSchema, type ProductFormData } from "@/lib/validations/product.schema";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import type { Product, SizeStock, CustomSizeChart } from "@/types/product";

interface ProductFormProps {
  initialData?: Product;
  productId?: string;
}

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size", "38", "40", "42", "44"];

export function ProductForm({ initialData, productId }: ProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [customSizeInputs, setCustomSizeInputs] = useState<Record<number, string>>({});
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [customSizeCharts, setCustomSizeCharts] = useState<CustomSizeChart[]>([]);

  useEffect(() => {
    getSiteSettings()
      .then((data) => {
        if (data?.sizeCharts) {
          setCustomSizeCharts(data.sizeCharts);
        }
      })
      .catch(console.error);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          slug: initialData.slug,
          sku: initialData.sku || "",
          description: initialData.description || "",
          subtitle: initialData.subtitle || "",
          price: initialData.price,
          salePrice: initialData.salePrice,
          category: initialData.category || "t-shirts",
          brand: initialData.brand || "LUNO",
          mainImage: initialData.mainImage || "",
          hoverImage: initialData.hoverImage || "",
          images: initialData.images || [],
          detailImages: initialData.detailImages || [],
          material: initialData.material || "100% Premium Cotton",
          weight: initialData.weight || "240 GSM",
          fit: initialData.fit || "Oversized Fit",
          sizeChartType: initialData.sizeChartType || "",
          sizeChartId: initialData.sizeChartId || "",
          sizeChartUrl: initialData.sizeChartUrl || "",
          featured: initialData.featured ?? true,
          bestSeller: initialData.bestSeller ?? false,
          isNew: initialData.isNew ?? true,
          variants: initialData.variants || [],
        }
      : {
          name: "",
          slug: "",
          sku: "",
          description: "",
          subtitle: "",
          price: 0,
          category: "t-shirts",
          brand: "LUNO",
          mainImage: "",
          hoverImage: "",
          images: [],
          detailImages: [],
          material: "100% Premium Cotton",
          weight: "240 GSM",
          fit: "Oversized Fit",
          sizeChartType: "",
          sizeChartId: "",
          sizeChartUrl: "",
          featured: true,
          bestSeller: false,
          isNew: true,
          variants: [
            {
              colorName: "أسود (Black)",
              colorHex: "#000000",
              image: "",
              sizes: [
                { size: "S", stock: 10 },
                { size: "M", stock: 10 },
                { size: "L", stock: 10 },
                { size: "XL", stock: 10 },
              ],
            },
          ],
        },
  });

  const watchedVariants = watch("variants") || [];
  const watchedMainImage = watch("mainImage");
  const watchedHoverImage = watch("hoverImage");
  const watchedSizeChartId = watch("sizeChartId");
  const watchedSizeChartUrl = watch("sizeChartUrl");
  const watchedDetailImages = watch("detailImages") || [];

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("name", val, { shouldValidate: true });
    if (!slugManuallyEdited && !productId) {
      setValue("slug", generateSlug(val), { shouldValidate: true });
    }
  };

  // Upload main cover image to Cloudinary
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const loadingToast = toast.loading("Uploading primary image...");
    try {
      const url = await uploadToCloudinary(file);
      setValue("mainImage", url, { shouldValidate: true });
      toast.success("Primary image uploaded successfully", { id: loadingToast });
    } catch {
      toast.error("Failed to upload image", { id: loadingToast });
    }
  };

  // Upload hover secondary image to Cloudinary
  const handleHoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const loadingToast = toast.loading("Uploading hover image...");
    try {
      const url = await uploadToCloudinary(file);
      setValue("hoverImage", url, { shouldValidate: true });
      toast.success("Hover image uploaded successfully", { id: loadingToast });
    } catch {
      toast.error("Failed to upload image", { id: loadingToast });
    }
  };

  // Upload 3 detail images for the card thumbnails stack (لوجو، خامة، تفاصيل)
  const handleDetailImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const loadingToast = toast.loading(`Uploading ${files.length} detail photo(s)...`);
    try {
      const urls = await Promise.all(files.map((file) => uploadToCloudinary(file)));
      const existing = watchedDetailImages;
      const updated = Array.from(new Set([...existing, ...urls])).slice(0, 3);
      setValue("detailImages", updated, { shouldValidate: true });
      toast.success("Card detail photos uploaded successfully", { id: loadingToast });
    } catch {
      toast.error("Failed to upload detail photos", { id: loadingToast });
    }
  };

  const removeDetailImage = (imgIdx: number) => {
    const updated = watchedDetailImages.filter((_, idx) => idx !== imgIdx);
    setValue("detailImages", updated, { shouldValidate: true });
  };

  // Upload color-specific variant images (multiple images supported per color)
  const handleVariantImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const loadingToast = toast.loading(`Uploading ${files.length} image(s)...`);
    try {
      const urls = await Promise.all(files.map((file) => uploadToCloudinary(file)));
      const current = [...watchedVariants];
      const existingImages = current[index].images || (current[index].image ? [current[index].image] : []);
      const newImages = Array.from(new Set([...existingImages, ...urls]));
      current[index] = {
        ...current[index],
        image: newImages[0] || "",
        images: newImages,
      };
      setValue("variants", current, { shouldValidate: true });
      toast.success("Color images uploaded successfully", { id: loadingToast });
    } catch {
      toast.error("Failed to upload images", { id: loadingToast });
    }
  };

  const removeVariantImage = (variantIdx: number, imgIdx: number) => {
    const current = [...watchedVariants];
    const variant = current[variantIdx];
    const existingImages = variant.images || (variant.image ? [variant.image] : []);
    const urlToRemove = existingImages[imgIdx];
    if (urlToRemove) {
      deleteFromCloudinary(urlToRemove).catch(console.error);
    }
    const updatedImages = existingImages.filter((_, idx) => idx !== imgIdx);
    current[variantIdx] = {
      ...variant,
      image: updatedImages[0] || "",
      images: updatedImages,
    };
    setValue("variants", current, { shouldValidate: true });
  };

  // Add new color variant card
  const addColorVariant = () => {
    if (!newColorName.trim()) {
      toast.error("Please enter a color name");
      return;
    }

    if (watchedVariants.some((v) => v.colorHex.toLowerCase() === newColorHex.toLowerCase())) {
      toast.error("A variant with this color hex already exists");
      return;
    }

    const newVariant = {
      colorName: newColorName.trim(),
      colorHex: newColorHex,
      image: "",
      sizes: [
        { size: "S", stock: 10 },
        { size: "M", stock: 10 },
        { size: "L", stock: 10 },
        { size: "XL", stock: 10 },
      ],
    };

    setValue("variants", [...watchedVariants, newVariant], { shouldValidate: true });
    setNewColorName("");
  };

  const removeColorVariant = (index: number) => {
    const variantToRemove = watchedVariants[index];
    if (variantToRemove) {
      const urlsToRemove = [variantToRemove.image, ...(variantToRemove.images || [])].filter(Boolean);
      if (urlsToRemove.length > 0) {
        deleteFromCloudinary(urlsToRemove).catch(console.error);
      }
    }
    const updated = watchedVariants.filter((_, idx) => idx !== index);
    setValue("variants", updated, { shouldValidate: true });
  };

  // Add a size to a color variant with default stock
  const addSizeToVariant = (variantIndex: number, size: string) => {
    const variant = watchedVariants[variantIndex];
    if (variant.sizes.some((s) => s.size.toLowerCase() === size.toLowerCase())) {
      toast.error(`Size "${size}" is already added to this color`);
      return;
    }

    const newSizeStock: SizeStock = { size: size.trim(), stock: 10 };
    const updatedSizes = [...variant.sizes, newSizeStock];
    
    const updatedVariants = [...watchedVariants];
    updatedVariants[variantIndex] = { ...variant, sizes: updatedSizes };
    
    setValue("variants", updatedVariants, { shouldValidate: true });
  };

  // Add Custom Size typed by user
  const handleAddCustomSize = (variantIndex: number) => {
    const raw = customSizeInputs[variantIndex] || "";
    const size = raw.trim();
    if (!size) {
      toast.error("Enter custom size name");
      return;
    }
    addSizeToVariant(variantIndex, size);
    setCustomSizeInputs((prev) => ({ ...prev, [variantIndex]: "" }));
  };

  // Remove a size from a color variant
  const removeSizeFromVariant = (variantIndex: number, sizeIndex: number) => {
    const variant = watchedVariants[variantIndex];
    const updatedSizes = variant.sizes.filter((_, idx) => idx !== sizeIndex);
    
    const updatedVariants = [...watchedVariants];
    updatedVariants[variantIndex] = { ...variant, sizes: updatedSizes };
    
    setValue("variants", updatedVariants, { shouldValidate: true });
  };

  // Update specific size stock input
  const updateSizeStock = (variantIndex: number, sizeIndex: number, rawStock: string) => {
    const updatedVariants = [...watchedVariants];
    const variant = updatedVariants[variantIndex];
    const sizes = [...variant.sizes];
    
    const stockVal = rawStock === "" ? 0 : Math.max(0, parseInt(rawStock) || 0);
    sizes[sizeIndex] = { ...sizes[sizeIndex], stock: stockVal };
    updatedVariants[variantIndex] = { ...variant, sizes };
    
    setValue("variants", updatedVariants, { shouldValidate: true });
  };

  const onSubmit = async (data: ProductFormData) => {
    setSaving(true);
    try {
      const sanitizedVariants = data.variants.map((v) => ({
        ...v,
        sizes: v.sizes.map((s) => ({
          ...s,
          stock: typeof s.stock === "number" && !isNaN(s.stock) ? s.stock : (parseInt(String(s.stock)) || 0),
        })),
      }));
      const sanitizedData: ProductFormData = {
        ...data,
        price: typeof data.price === "number" && !isNaN(data.price) ? data.price : (parseFloat(String(data.price)) || 0),
        salePrice: data.salePrice !== undefined && data.salePrice !== null && String(data.salePrice) !== ""
          ? parseFloat(String(data.salePrice)) || 0
          : undefined,
        variants: sanitizedVariants,
      };

      if (productId && initialData) {
        const oldImages = extractProductImages(initialData);
        const newImages = extractProductImages(sanitizedData);
        const removedImages = oldImages.filter((url) => !newImages.includes(url));
        if (removedImages.length > 0) {
          deleteFromCloudinary(removedImages).catch(console.error);
        }
        await updateProduct(productId, sanitizedData);
        toast.success("تم تحديث المنتج بنجاح!");
      } else if (productId) {
        await updateProduct(productId, sanitizedData);
        toast.success("تم تحديث المنتج بنجاح!");
      } else {
        await createProduct(sanitizedData);
        toast.success("تم إنشاء المنتج بنجاح!");
      }
      router.refresh();
      router.push("/admin/products");
    } catch {
      toast.error("فشل حفظ المنتج. يرجى التحقق من مدخلات النموذج.");
    } finally {
      setSaving(false);
    }
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 max-w-4xl font-sans">
      
      {/* 1. Basic Info Panel */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
        <h2 className="font-black text-xs text-zinc-900 uppercase tracking-widest mb-6">معلومات المنتج الأساسية</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              اسم المنتج
            </label>
            <input
              className="w-full px-4 py-3 border border-zinc-100 rounded-xl text-xs bg-white focus:outline-none focus:border-zinc-300 focus:ring-1 focus:ring-zinc-200/50 transition-all font-semibold text-zinc-800 placeholder:text-zinc-400"
              placeholder="مثال: هودي مينيمال"
              {...register("name")}
              onChange={handleNameChange}
            />
            {errors.name && (
              <p className="text-red-500 text-[10px] font-bold mt-1.5 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Slug (رابط المنتج في المتصفح)
              </label>
              <button
                type="button"
                onClick={() => {
                  const currentName = watch("name");
                  if (currentName) {
                    setValue("slug", generateSlug(currentName), { shouldValidate: true });
                    setSlugManuallyEdited(false);
                    toast.success("تم توليد الرابط تلقائياً من اسم المنتج");
                  }
                }}
                className="text-[9px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 transition-all flex items-center gap-1 cursor-pointer"
                title="توليد رابط تلقائي من اسم المنتج"
              >
                ⚡ توليد من الاسم
              </button>
            </div>
            <input
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-xs bg-white focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all font-mono font-semibold text-zinc-900 placeholder:text-zinc-400"
              placeholder="مثال: minimalist-oversized-hoodie"
              {...register("slug")}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setValue("slug", e.target.value, { shouldValidate: true });
              }}
            />
            <p className="text-[9px] text-zinc-400 mt-1">يمكنك كتابة أي رابط مخصص يعجبك براحتك مستقل عن اسم المنتج</p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              كود المنتج (SKU)
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 px-4 py-3 border border-zinc-100 rounded-xl text-xs bg-zinc-50 focus:outline-none focus:border-zinc-300 focus:ring-1 focus:ring-zinc-200/50 transition-all font-mono font-black text-zinc-800 uppercase"
                placeholder="LUNO-XXXX"
                {...register("sku")}
              />
              {!productId && (
                <button
                  type="button"
                  onClick={() => setValue("sku", generateSKU())}
                  className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-[10px] font-bold text-zinc-600 transition-all whitespace-nowrap"
                  title="توليد كود جديد"
                >
                  🔄 جديد
                </button>
              )}
            </div>
            {errors.sku && (
              <p className="text-red-500 text-[10px] font-bold mt-1.5 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.sku.message}
              </p>
            )}
            <p className="text-[9px] text-zinc-400 mt-1">الكود يظهر في رابط المنتج — لا يمكن تكراره</p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              الوصف
            </label>
            <textarea
              className="w-full px-4 py-3 border border-zinc-100 rounded-xl text-xs bg-white focus:outline-none focus:border-zinc-300 focus:ring-1 focus:ring-zinc-200/50 transition-all font-medium text-zinc-800 placeholder:text-zinc-400 resize-none"
              rows={4}
              placeholder="وصف القماش، المقاس، التصميم، تعليمات الغسيل..."
              {...register("description")}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              العنوان الفرعي للمنتج (Subtitle)
            </label>
            <input
              className="w-full px-4 py-3 border border-zinc-100 rounded-xl text-xs bg-white focus:outline-none focus:border-zinc-300 transition-all font-semibold text-zinc-800"
              placeholder="مثال: Premium Oversized Fit"
              {...register("subtitle")}
            />
          </div>

          {/* Dedicated Fabric Material Custom Manual Input Box */}
          <div className="sm:col-span-2 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
            <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center justify-between">
              <span>🧵 نوع خامة القماش (اكتب اسم الخامة بيدك)</span>
              <span className="text-[10px] font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                يقرأها الشات بوت فوراً للعملاء
              </span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-amber-200 rounded-xl text-xs bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-semibold text-zinc-900 placeholder:text-zinc-400"
              placeholder="اكتب اسم خامة القماش هنا بيدك (مثال: 100% قطن مصري، ميلتون بايلوت 240 GSM، جابردين فاخر...)"
              {...register("material")}
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-zinc-400 font-medium">اقتراحات خامات سريعة:</span>
              {["قطن مصري 100%", "ميلتون بايلوت 240 GSM", "جابردين فاخر", "كتان مغسول", "أوفر سايز قطن 100%"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setValue("material", preset, { shouldValidate: true })}
                  className="text-[10px] bg-white border border-zinc-200 hover:border-amber-400 text-zinc-700 px-2.5 py-1 rounded-lg transition-all font-medium cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              الوزن / السمك (GSM)
            </label>
            <input
              className="w-full px-4 py-3 border border-zinc-100 rounded-xl text-xs bg-white focus:outline-none focus:border-zinc-300 transition-all font-semibold text-zinc-800"
              placeholder="مثال: 230 GSM"
              {...register("weight")}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              القصة / الفئة (Fit / Gender)
            </label>
            <input
              className="w-full px-4 py-3 border border-zinc-100 rounded-xl text-xs bg-white focus:outline-none focus:border-zinc-300 transition-all font-semibold text-zinc-800"
              placeholder="مثال: Unisex / Boxy Fit"
              {...register("fit")}
            />
          </div>

          <div className="sm:col-span-2 pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("isNew")}
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <span className="text-xs font-bold text-zinc-800">تمييز المنتج كمنتج جديد (عرض شارة NEW الذهبية)</span>
            </label>
          </div>
        </div>
      </div>


      {/* 2. Card Detail Images (3 Thumbnail Photos for Card Stack) */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
        <h2 className="font-black text-xs text-zinc-900 uppercase tracking-widest mb-2">Card Detail Photos (3 صور المصغرة للكارت)</h2>
        <p className="text-[10px] text-zinc-400 font-medium mb-6">
          أضف 3 صور للتفاصيل المعروضة عمودياً يمين الكارت (صورة اللوجو، صورة الخاطة/التيكيت، صورة الظهر أو التفاصيل الإضافية).
        </p>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {watchedDetailImages.map((imgUrl, imgIdx) => (
              <div key={imgIdx} className="w-24 h-24 rounded-2xl bg-zinc-50 border border-zinc-200 relative overflow-hidden group shadow-sm flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgUrl} alt={`Detail ${imgIdx + 1}`} className="w-full h-full object-contain p-1" />
                <button
                  type="button"
                  onClick={() => removeDetailImage(imgIdx)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110"
                  title="إزالة الصورة"
                >
                  <X size={12} />
                </button>
                <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                  صورة {imgIdx + 1}
                </span>
              </div>
            ))}

            {watchedDetailImages.length < 3 && (
              <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-200 hover:border-zinc-400 bg-zinc-50/50 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all">
                <Upload size={16} className="text-zinc-400" />
                <span className="text-[9px] font-bold text-zinc-500 text-center px-1">
                  رفع صور التفاصيل ({3 - watchedDetailImages.length} متبقية)
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                  onChange={handleDetailImagesUpload}
                />
              </label>
            )}
          </div>
        </div>
      </div>


      {/* 2. Cover / Main Image Card */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
        <h2 className="font-black text-xs text-zinc-900 uppercase tracking-widest mb-2">صورة غلاف المنتج الرئيسية</h2>
        <p className="text-[10px] text-zinc-400 font-medium mb-6">
          الصورة الغلافية الرئيسية المعروضة على كرت المنتج في قائمة المتجر.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-32 h-32 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden p-2 relative">
            {watchedMainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={watchedMainImage} alt="Main Preview" className="object-contain w-full h-full" />
            ) : (
              <span className="text-[10px] text-zinc-300 font-black">غلاف المنتج</span>
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <label className="inline-flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-xl font-bold text-[10px] hover:bg-zinc-800 transition-all cursor-pointer shadow-md shadow-zinc-900/10">
              <Upload size={12} />
              رفع صورة الغلاف
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleMainImageUpload}
              />
            </label>
            <p className="text-[9px] text-zinc-400 font-mono leading-none truncate max-w-md">
              {watchedMainImage || "لم يتم رفع صورة الغلاف بعد"}
            </p>
          </div>
        </div>
      </div>

      {/* 2b. Hover Second Image Card (صورة الهوفر الثانية) */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
        <h2 className="font-black text-xs text-zinc-900 uppercase tracking-widest mb-2">صورة الهوفر الثانوية (Hover Image)</h2>
        <p className="text-[10px] text-zinc-400 font-medium mb-6">
          الصورة الثانية التي تظهر بسلاسة عند تمرير الماوس فوق كارت المنتج في المتجر (اختياري).
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-32 h-32 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden p-2 relative">
            {watchedHoverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={watchedHoverImage} alt="Hover Preview" className="object-contain w-full h-full" />
            ) : (
              <span className="text-[10px] text-zinc-300 font-black">صورة الهوفر</span>
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <label className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-[10px] hover:bg-amber-700 transition-all cursor-pointer shadow-md shadow-amber-600/10">
              <Upload size={12} />
              رفع صورة الهوفر (Hover Image)
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleHoverImageUpload}
              />
            </label>
            {watchedHoverImage && (
              <button
                type="button"
                onClick={() => setValue("hoverImage", "", { shouldValidate: true })}
                className="block text-[10px] text-red-500 hover:underline font-bold"
              >
                إزالة صورة الهوفر
              </button>
            )}
            <p className="text-[9px] text-zinc-400 font-mono leading-none truncate max-w-md">
              {watchedHoverImage || "إذا لم ترفع صورة، سيتم استخدام صورة اللون الثاني تلقائياً عند الهوفر"}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Pricing */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)] space-y-4">
        <div>
          <h2 className="font-black text-xs text-zinc-900 uppercase tracking-widest">أسعار المنتج والخصومات</h2>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">
            حدد سعر البيع وسعر الخصم. إذا كان هناك خصم، سيظهر السعر الأصلي مشطوباً وبجانبه شارة الخصم ٪.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center justify-between">
              <span>السعر الأصلي (قبل الخصم) (ج.م) *</span>
              <span className="text-[9px] text-zinc-400 font-mono">السعر الأساسي</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-xs bg-white focus:outline-none focus:border-zinc-900 transition-all font-bold text-zinc-900 placeholder:text-zinc-400"
              placeholder="مثال: 1200"
              {...register("price", { valueAsNumber: true })}
            />
            <p className="text-[9px] text-zinc-400 font-medium">
              السعر الأصلي للمنتج (سيظهر مشطوباً <s>1200 ج.م</s> في حالة وجود سعر مخفض).
            </p>
          </div>

          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center justify-between">
              <span>سعر البيع النهائي بعد الخصم (ج.م) (اختياري)</span>
              <span className="text-[9px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                سعر العميل الحالي
              </span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              className="w-full px-4 py-3 border border-amber-200 rounded-xl text-xs bg-white focus:outline-none focus:border-amber-500 transition-all font-black text-amber-900 placeholder:text-zinc-400"
              placeholder="مثال: 950"
              {...register("salePrice", { valueAsNumber: true })}
            />
            <p className="text-[9px] text-amber-700 font-medium">
              السعر المخفّض الذي يدفعه العميل فعلياً عند الشراء (مثال: 950 ج.م). اتركه فارغاً إذا لم يكن هناك خصم.
            </p>
          </div>
        </div>
      </div>

      {/* 3.5 Custom Size Chart Selection Panel */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)] space-y-4">
        <div>
          <h2 className="font-black text-xs text-zinc-900 uppercase tracking-widest flex items-center gap-2">
            <span>📏 جدول المقاسات للمنتج (CUSTOM SIZE CHART)</span>
          </h2>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">
            اختر جدول المقاسات المناسب لهذا المنتج من الجداول التي قمت برفعها وتسميتها في الإعدادات
          </p>
        </div>

        {customSizeCharts.length === 0 ? (
          <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs text-zinc-600 text-center space-y-1">
            <p>لم تقم برفع أي جدول مقاسات في الإعدادات حتى الآن.</p>
            <p className="text-[11px] text-zinc-400">
              يمكنك إضافة وتسمية جداول مقاساتك الخاصة بسهولة عبر الانتقال إلى{" "}
              <a href="/admin/settings" target="_blank" className="font-bold underline text-zinc-900">
                صفحة الإعدادات &gt; جداول المقاسات المخصصة
              </a>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setValue("sizeChartId", "", { shouldValidate: true });
                setValue("sizeChartUrl", "", { shouldValidate: true });
              }}
              className={`p-3 rounded-xl border-2 text-right transition-all flex items-center gap-3 ${
                !watchedSizeChartUrl
                  ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
                  : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 text-zinc-700"
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-zinc-200/40 flex items-center justify-center font-bold text-xs">
                🚫
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold">بدون جدول مقاسات</p>
                <p className="text-[10px] opacity-70">عدم عرض جدول مقاسات للمنتج</p>
              </div>
            </button>

            {customSizeCharts.map((chart) => {
              const isSelected = watchedSizeChartUrl === chart.imageUrl || watchedSizeChartId === chart.id;
              return (
                <button
                  key={chart.id}
                  type="button"
                  onClick={() => {
                    setValue("sizeChartId", chart.id, { shouldValidate: true });
                    setValue("sizeChartUrl", chart.imageUrl, { shouldValidate: true });
                  }}
                  className={`p-3 rounded-xl border-2 text-right transition-all flex items-center gap-3 ${
                    isSelected
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
                      : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 text-zinc-700"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-300/30 flex-shrink-0 bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={chart.imageUrl} alt={chart.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{chart.name}</p>
                    <p className="text-[10px] opacity-70">جدول مقاسات مخصص</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Live Preview of Selected Size Chart */}
        {watchedSizeChartUrl && (
          <div className="border border-zinc-100 rounded-xl p-3 bg-zinc-50 flex flex-col items-center mt-3">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
              معاينة جدول المقاسات المختار للمنتج:
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={watchedSizeChartUrl}
              alt="Selected Size Chart"
              className="max-h-56 object-contain rounded-lg border border-zinc-200 shadow-sm"
            />
          </div>
        )}
      </div>

      {/* 4. Variants & Stock */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-black text-xs text-zinc-900 uppercase tracking-widest">الألوان والكميات المتاحة (Variants & Stock)</h2>
            <p className="text-[10px] text-zinc-400 font-medium mt-1">
              أضف ألوان المنتج وحدد الكميات والمقاسات المتاحة لكل لون على حدة.
            </p>
          </div>
        </div>

        {/* Add Color Creator */}
        <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl mb-8 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              className="w-9 h-9 rounded-xl border-none cursor-pointer bg-transparent"
            />
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">{newColorHex}</span>
          </div>

          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="اسم اللون (مثال: أسود، كحلي، أوف وايت...)"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addColorVariant())}
              className="w-full px-4 py-2.5 border border-zinc-100 rounded-xl text-xs bg-white focus:outline-none focus:border-zinc-300 transition-all font-semibold text-zinc-800 placeholder:text-zinc-400"
            />
          </div>

          <button
            type="button"
            onClick={addColorVariant}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-md shadow-zinc-900/10"
          >
            <Plus size={12} />
            إضافة لون
          </button>
        </div>

        {/* Variant Cards List */}
        <div className="space-y-6">
          {watchedVariants.map((variant, variantIdx) => (
            <div 
              key={variant.colorHex}
              className="border border-zinc-100 rounded-2xl p-5 space-y-4 hover:border-zinc-300 transition-all duration-300 bg-white"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-zinc-50 pb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-zinc-200" 
                    style={{ backgroundColor: variant.colorHex }}
                  />
                  <span className="text-xs font-black text-zinc-900">{variant.colorName}</span>
                  <span className="text-[9px] text-zinc-400 font-mono">({variant.colorHex})</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeColorVariant(variantIdx)}
                  className="text-zinc-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Card Body */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* Variant Images upload (Multiple photos per color supported) */}
                <div className="md:col-span-5 flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-2xl p-4 bg-zinc-50/50 space-y-3">
                  <div className="w-full">
                    <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-2 text-center">
                      صور هذا اللون ({(variant.images && variant.images.length > 0) ? variant.images.length : (variant.image ? 1 : 0)})
                    </span>

                    <div className="flex flex-wrap items-center justify-center gap-2 max-h-36 overflow-y-auto p-1">
                      {(variant.images && variant.images.length > 0
                        ? variant.images
                        : variant.image
                        ? [variant.image]
                        : []
                      ).map((imgUrl, imgIdx) => (
                        <div key={imgIdx} className="w-16 h-16 rounded-xl bg-white border border-zinc-200 relative overflow-hidden group shadow-sm flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgUrl} alt={`Variant ${variant.colorName} ${imgIdx + 1}`} className="w-full h-full object-contain p-0.5" />
                          <button
                            type="button"
                            onClick={() => removeVariantImage(variantIdx, imgIdx)}
                            className="absolute top-0.5 right-0.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110"
                            title="إزالة الصورة"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}

                      {(!variant.images || variant.images.length === 0) && !variant.image && (
                        <div className="w-16 h-16 rounded-xl bg-white border border-dashed border-zinc-200 flex items-center justify-center text-zinc-300">
                          <Palette size={20} />
                        </div>
                      )}
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-1.5 bg-zinc-900 text-white px-3.5 py-2 rounded-xl font-bold text-[10px] hover:bg-zinc-800 transition-all cursor-pointer shadow-sm active:scale-95">
                    <Upload size={12} />
                    رفع صور هذا اللون
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      className="hidden" 
                      onChange={(e) => handleVariantImageUpload(variantIdx, e)}
                    />
                  </label>
                </div>

                {/* Variant Sizes & Fulfillment Stock */}
                <div className="md:col-span-8 space-y-4">
                  <div>
                    <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      كميات ومقاسات هذا اللون
                    </span>
                    
                    {/* Quick Add size tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {AVAILABLE_SIZES.map((size) => {
                        const isAdded = variant.sizes.some((s) => s.size.toLowerCase() === size.toLowerCase());
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => addSizeToVariant(variantIdx, size)}
                            disabled={isAdded}
                            className={`px-2.5 py-1 rounded text-[9px] font-bold border transition-all ${
                              isAdded
                                ? "bg-zinc-50 border-zinc-100 text-zinc-300 cursor-not-allowed"
                                : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-950"
                            }`}
                          >
                            + {size}
                          </button>
                        );
                      })}
                    </div>

                    {/* CUSTOM SIZE INPUT BOX (إضافة مقاس مخصص بكتابتك) */}
                    <div className="flex items-center gap-2 mb-4 p-2 bg-zinc-50 border border-zinc-100 rounded-xl">
                      <input
                        type="text"
                        placeholder="إضافة مقاس مخصص بيدك (مثال: 38, 40, 3XL, Oversized...)"
                        value={customSizeInputs[variantIdx] || ""}
                        onChange={(e) => setCustomSizeInputs((prev) => ({ ...prev, [variantIdx]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomSize(variantIdx);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-900 bg-white focus:outline-none focus:border-zinc-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomSize(variantIdx)}
                        className="px-3.5 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm"
                      >
                        + إضافة مقاس
                      </button>
                    </div>
                    
                    {/* Size and stock inputs list */}
                    {variant.sizes.length === 0 ? (
                      <p className="text-[10px] text-zinc-400 font-medium italic py-2">
                        لم يتم إضافة مقاسات لهذا اللون بعد. استخدم خيارات الأعلى لإضافة المقاسات.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        {variant.sizes.map((sizeStock, sizeIdx) => (
                          <div 
                            key={sizeStock.size}
                            className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-1.5"
                          >
                            <span className="text-[10px] font-black text-zinc-800 min-w-[32px]">{sizeStock.size}</span>
                            <div className="flex-1 flex items-center gap-1 bg-white border border-zinc-100 rounded-lg px-2 py-0.5">
                              <span className="text-[8px] font-bold text-zinc-400 uppercase">الكمية</span>
                              <input 
                                type="number"
                                min="0"
                                value={sizeStock.stock ?? ""}
                                onChange={(e) => updateSizeStock(variantIdx, sizeIdx, e.target.value)}
                                className="w-full text-xs font-bold text-zinc-900 border-none outline-none focus:ring-0 p-0 text-right"
                              />

                            </div>
                            <button
                              type="button"
                              onClick={() => removeSizeFromVariant(variantIdx, sizeIdx)}
                              className="text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-100">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="px-5 py-3 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-xs font-black hover:bg-zinc-800 transition-all shadow-md shadow-zinc-900/10 disabled:opacity-50"
        >
          {saving ? "جارٍ الحفظ..." : productId ? "حفظ التعديلات" : "حفظ وإنشاء المنتج"}
        </button>
      </div>
    </form>
  );
}
