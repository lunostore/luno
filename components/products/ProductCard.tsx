"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Eye, Shirt, Layers, Users } from "lucide-react";
import { useWishlist } from "@/features/wishlist/WishlistProvider";
import { useCart } from "@/features/cart/CartProvider";
import { formatPrice, getDiscountPercentage } from "@/lib/utils";
import { toast } from "sonner";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const router = useRouter();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addItem, openCart } = useCart();

  const isFavorite = isInWishlist(product.id);
  const displayPrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPct = hasDiscount
    ? getDiscountPercentage(product.price, product.salePrice!)
    : 0;

  const staggerDelay = (index % 4) * 0.08;

  // Selected Variant state
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const activeVariant = product.variants?.[selectedVariantIdx] || null;

  // Compute available gallery images for thumbnails:
  // 1. Explicit detailImages (3 images: logo detail, fabric detail, back/extra detail)
  // 2. Or images from active variant / hoverImage / general images array
  const detailImages = product.detailImages && product.detailImages.length > 0
    ? product.detailImages
    : (function () {
        const list: string[] = [];
        if (activeVariant?.images && activeVariant.images.length > 0) {
          list.push(...activeVariant.images);
        } else if (activeVariant?.image) {
          list.push(activeVariant.image);
        }
        if (product.mainImage && !list.includes(product.mainImage)) list.push(product.mainImage);
        if (product.hoverImage && !list.includes(product.hoverImage)) list.push(product.hoverImage);
        if (product.images) {
          product.images.forEach((img) => {
            if (img && !list.includes(img)) list.push(img);
          });
        }
        return list;
      })();

  // Thumbnail list for the right vertical stack (maximum 3 thumbnails)
  const stackThumbnails = detailImages.slice(0, 3);

  // Primary base image (main cover image of product or selected color variant)
  const basePrimaryImage =
    activeVariant?.image || product.mainImage || stackThumbnails[0] || "/placeholder.jpg";

  // Hovered thumbnail preview state (resets to null onMouseLeave)
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  // Explicit clicked thumbnail override state (resets onMouseLeave or when another color is clicked)
  const [clickedImage, setClickedImage] = useState<string | null>(null);

  // Active display image priority: hoveredImage > clickedImage > basePrimaryImage
  const currentDisplayImage = hoveredImage || clickedImage || basePrimaryImage;

  // Navigate to product page
  const navigateToProduct = () => {
    router.push(`/products?id=${encodeURIComponent(product.id)}`);
  };

  // Add to cart directly
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    const selectedColor = activeVariant
      ? {
          name: activeVariant.colorName,
          hex: activeVariant.colorHex,
          image: activeVariant.image || product.mainImage,
        }
      : {
          name: "Standard",
          hex: "#000000",
          image: product.mainImage,
        };

    const firstAvailableSize =
      activeVariant?.sizes?.find((s) => s.stock > 0)?.size ||
      activeVariant?.sizes?.[0]?.size ||
      "M";

    addItem(product, 1, firstAvailableSize, selectedColor);
    toast.success(`تمت إضافة ${product.name} إلى السلة! 🛒`, {
      description: `المقاس: ${firstAvailableSize} | اللون: ${selectedColor.name}`,
    });
    openCart();
  };

  const isNewProduct =
    product.isNew ||
    (product.createdAt &&
      new Date().getTime() - new Date(product.createdAt.toString()).getTime() <
        14 * 24 * 60 * 60 * 1000);

  return (
    <motion.article
      initial={{ opacity: 0, y: 40, scale: 0.93, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.65,
        delay: staggerDelay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative h-full flex flex-col"
    >
      {/* Main Luxury Dark Card Wrapper — Fixed height flex-col container */}
      <div
        onClick={navigateToProduct}
        onMouseLeave={() => {
          setHoveredImage(null);
          setClickedImage(null);
        }}
        className="block bg-[#121212] dark:bg-[#0e0e0e] border border-zinc-800/80 hover:border-zinc-700 rounded-[2rem] p-4 sm:p-5 shadow-2xl transition-all duration-300 cursor-pointer select-none overflow-hidden h-full flex flex-col justify-between"
      >
        <div>
          {/* Top Badges & Actions Overlay */}
          <div className="flex items-center justify-between mb-3.5 z-20 relative h-9">
            {/* Left Badges (NEW / SALE / BEST SELLER) */}
            <div className="flex items-center gap-2">
              {isNewProduct ? (
                <span className="border border-amber-400/50 text-amber-300 bg-amber-400/10 text-[10px] font-extrabold uppercase px-3 py-1 rounded-lg tracking-wider backdrop-blur-md shadow-sm">
                  NEW
                </span>
              ) : hasDiscount ? (
                <span className="border border-red-500/50 text-red-400 bg-red-500/10 text-[10px] font-extrabold uppercase px-3 py-1 rounded-lg tracking-wider backdrop-blur-md">
                  -{discountPct}%
                </span>
              ) : product.bestSeller ? (
                <span className="border border-amber-400/50 text-amber-300 bg-amber-400/10 text-[10px] font-extrabold uppercase px-3 py-1 rounded-lg tracking-wider backdrop-blur-md">
                  BEST SELLER
                </span>
              ) : null}
            </div>

            {/* Right Wishlist Heart Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product);
              }}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 border border-zinc-800 text-white flex items-center justify-center transition-all backdrop-blur-md shadow-md hover:scale-110 active:scale-95"
              title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            >
              <Heart
                size={15}
                className={isFavorite ? "fill-red-500 text-red-500" : "text-white"}
              />
            </button>
          </div>

          {/* ── PRODUCT IMAGES DISPLAY SECTION ── */}
          <div className="grid grid-cols-12 gap-3 mb-4">
            {/* Main Large Image Container (Left - Col 8/9) */}
            <div className="col-span-8 sm:col-span-9 relative aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-900/90 border border-zinc-800/60 shadow-inner flex items-center justify-center">
              <motion.div
                className="w-full h-full relative"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <Image
                  key={currentDisplayImage}
                  src={currentDisplayImage}
                  alt={product.name}
                  fill
                  priority={index < 4}
                  quality={95}
                  crossOrigin="anonymous"
                  sizes="(max-width: 640px) 70vw, 30vw"
                  className="object-contain object-center p-2 transition-all duration-500"
                />
              </motion.div>

              {/* Quick Hover Overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                <span className="bg-black/75 text-white text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                  <Eye size={12} />
                  عرض التفاصيل
                </span>
              </div>
            </div>

            {/* Right Vertical Stack (3 Thumbnail Boxes - Col 4/3) */}
            <div className="col-span-4 sm:col-span-3 flex flex-col justify-between gap-2">
              {stackThumbnails.map((imgUrl, thumbIdx) => {
                const isHovered = hoveredImage === imgUrl;
                const isSelected = currentDisplayImage === imgUrl;
                return (
                  <div
                    key={imgUrl + thumbIdx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setClickedImage(imgUrl);
                    }}
                    onMouseEnter={() => setHoveredImage(imgUrl)}
                    onMouseLeave={() => setHoveredImage(null)}
                    className={`aspect-square rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer relative bg-zinc-900/80 ${
                      isSelected || isHovered
                        ? "border-amber-400 ring-1 ring-amber-400/50 scale-[1.03] shadow-md opacity-100"
                        : "border-zinc-800/80 opacity-70 hover:opacity-100 hover:border-zinc-600"
                    }`}
                    title={`معاينة الصورة ${thumbIdx + 1}`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`${product.name} detail ${thumbIdx + 1}`}
                      fill
                      sizes="100px"
                      className="object-cover object-center p-0.5"
                    />
                  </div>
                );
              })}

              {/* Fallback empty thumb slots if product has fewer than 3 images */}
              {Array.from({ length: Math.max(0, 3 - stackThumbnails.length) }).map(
                (_, emptyIdx) => (
                  <div
                    key={`empty-${emptyIdx}`}
                    className="aspect-square rounded-xl border border-dashed border-zinc-800/60 bg-zinc-900/40 flex items-center justify-center text-zinc-700 text-[10px] font-black"
                  >
                    LUNO
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* ── PRODUCT INFO & DETAILS SECTION (Flex-1 & Always aligned) ── */}
        <div className="flex-1 flex flex-col justify-between space-y-3 pt-1">
          <div>
            {/* Header Row: Title & Price */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide leading-tight group-hover:text-amber-400 transition-colors line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-xs text-zinc-400 font-medium mt-0.5 line-clamp-1">
                  {product.subtitle || "Premium Oversized Fit"}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-base sm:text-lg font-black text-[#D4B886]">
                  {formatPrice(displayPrice)}
                </span>
                {hasDiscount && (
                  <p className="text-[11px] text-zinc-500 line-through font-semibold">
                    {formatPrice(product.price)}
                  </p>
                )}
              </div>
            </div>

            {/* Specifications Row (Icon Badges) — Fixed Height */}
            <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-zinc-400 font-medium pt-1 pb-2 border-b border-zinc-800/80 h-7 overflow-hidden">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Shirt size={13} className="text-zinc-400 flex-shrink-0" />
                {product.material || "100% Cotton"}
              </span>

              <span className="text-zinc-600">|</span>

              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Layers size={13} className="text-zinc-400 flex-shrink-0" />
                {product.weight || "230 GSM"}
              </span>

              <span className="text-zinc-600">|</span>

              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Users size={13} className="text-zinc-400 flex-shrink-0" />
                {product.fit || "Unisex"}
              </span>
            </div>

            {/* Color Swatches selection — Fixed height block (h-7) for uniform card alignment */}
            <div className="h-7 flex items-center pt-1.5">
              {product.variants && product.variants.length > 1 ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    الألوان:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {product.variants.map((variant, vIdx) => (
                      <button
                        key={variant.colorHex + vIdx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVariantIdx(vIdx);
                          setClickedImage(null);
                          setHoveredImage(null);
                        }}
                        className={`w-3.5 h-3.5 rounded-full transition-all border ${
                          selectedVariantIdx === vIdx
                            ? "ring-2 ring-amber-400 scale-125 z-10 border-black"
                            : "opacity-70 hover:opacity-100 hover:scale-110 border-zinc-700"
                        }`}
                        style={{ backgroundColor: variant.colorHex }}
                        title={variant.colorName}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* ── ACTION BUTTONS ROW (BAG + ADD TO CART) ── */}
          <div className="flex items-center gap-2.5 pt-2 mt-auto">
            {/* Bag Icon Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-12 h-12 rounded-xl sm:rounded-2xl border border-zinc-800 bg-zinc-900/90 text-white flex items-center justify-center hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95 shadow-md flex-shrink-0"
              title="إضافة سريعة للسلة"
            >
              <ShoppingBag size={18} />
            </button>

            {/* Main ADD TO CART Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 h-12 rounded-xl sm:rounded-2xl bg-[#D4B886] hover:bg-[#C5A775] text-zinc-950 font-black text-xs sm:text-sm tracking-widest uppercase flex items-center justify-center transition-all shadow-xl active:scale-95 cursor-pointer"
            >
              ADD TO CART
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
