"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Eye, Shirt, Layers, Users } from "lucide-react";
import { useWishlist } from "@/features/wishlist/WishlistProvider";
import { useProductModal } from "@/features/product-modal/ProductModalProvider";
import { formatPrice, getDiscountPercentage } from "@/lib/utils";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { openProduct } = useProductModal();

  const isFavorite = isInWishlist(product.id);
  const displayPrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPct = hasDiscount
    ? getDiscountPercentage(product.price, product.salePrice!)
    : 0;

  const staggerDelay = (index % 4) * 0.08;

  // Selected Color Variant state (null initially so product.mainImage is always default)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null);
  const activeVariant =
    selectedVariantIdx !== null && product.variants?.[selectedVariantIdx]
      ? product.variants[selectedVariantIdx]
      : null;

  // Second Image for hover effect over the main image area
  const secondImage =
    product.hoverImage ||
    (product.images && product.images.length > 0 ? product.images[0] : null) ||
    null;

  // Base primary image (ALWAYS product.mainImage initially unless user selected a specific color)
  const basePrimaryImage =
    (activeVariant && activeVariant.image) || product.mainImage || "/placeholder.jpg";

  // Mouse hover state over main image container
  const [isHoveringMain, setIsHoveringMain] = useState(false);

  // Active display image priority:
  // 1. Hover state -> secondImage (if available)
  // 2. Default state -> basePrimaryImage (product.mainImage)
  const currentDisplayImage =
    isHoveringMain && secondImage ? secondImage : basePrimaryImage;

  // Open product in modal overlay (no page navigation = no reload)
  const navigateToProduct = () => {
    openProduct(product.id);
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
      {/* Main Card Wrapper — Completely Borderless & Shadowless Floating Container */}
      <div
        onClick={navigateToProduct}
        onMouseLeave={() => {
          setIsHoveringMain(false);
        }}
        className="block bg-transparent rounded-[2rem] p-4 sm:p-5 shadow-none transition-all duration-300 cursor-pointer select-none overflow-hidden h-full flex flex-col justify-between border-0"
      >
        <div>
          {/* Top Badges & Actions Overlay */}
          <div className="flex items-center justify-between mb-3.5 z-20 relative h-9">
            {/* Left Badges (NEW / SALE / BEST SELLER) */}
            <div className="flex items-center gap-2">
              {isNewProduct ? (
                <span className="text-amber-700 dark:text-amber-300 bg-amber-400/20 dark:bg-amber-400/15 text-[10px] font-extrabold uppercase px-3 py-1 rounded-lg tracking-wider backdrop-blur-md">
                  NEW
                </span>
              ) : hasDiscount ? (
                <span className="text-red-600 dark:text-red-400 bg-red-500/20 dark:bg-red-500/15 text-[10px] font-extrabold uppercase px-3 py-1 rounded-lg tracking-wider backdrop-blur-md">
                  -{discountPct}%
                </span>
              ) : product.bestSeller ? (
                <span className="text-amber-700 dark:text-amber-300 bg-amber-400/20 dark:bg-amber-400/15 text-[10px] font-extrabold uppercase px-3 py-1 rounded-lg tracking-wider backdrop-blur-md">
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
              className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-white flex items-center justify-center transition-all backdrop-blur-md hover:scale-110 active:scale-95 border-0 shadow-none"
              title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            >
              <Heart
                size={15}
                className={isFavorite ? "fill-red-500 text-red-500" : "text-zinc-700 dark:text-white"}
              />
            </button>
          </div>

          {/* ── PRODUCT IMAGES DISPLAY SECTION ── */}
          <div
            onMouseEnter={() => setIsHoveringMain(true)}
            onMouseLeave={() => setIsHoveringMain(false)}
            className="w-full relative aspect-[4/5] rounded-2xl overflow-hidden bg-black flex items-center justify-center border-0 dark:border dark:border-zinc-800/80 shadow-none mb-4"
          >
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
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-contain object-center p-1.5 transition-all duration-500"
              />
            </motion.div>

            {/* Quick Hover Overlay */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
              <span className="bg-black/80 text-white text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                <Eye size={12} />
                عرض التفاصيل
              </span>
            </div>
          </div>
        </div>

        {/* ── PRODUCT INFO & DETAILS SECTION ── */}
        <div className="flex-1 flex flex-col justify-between space-y-3 pt-1">
          <div>
            {/* Header Row: Title & Price */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wide leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5 line-clamp-1">
                  {product.subtitle || "Premium Oversized Fit"}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-base sm:text-lg font-black text-amber-600 dark:text-[#D4B886]">
                  {formatPrice(displayPrice)}
                </span>
                {hasDiscount && (
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 line-through font-semibold">
                    {formatPrice(product.price)}
                  </p>
                )}
              </div>
            </div>

            {/* Specifications Row (Icon Badges) */}
            <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium pt-1 pb-2 h-7 overflow-hidden">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Shirt size={13} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                {product.material || "100% Cotton"}
              </span>

              <span className="text-zinc-300 dark:text-zinc-700">|</span>

              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Layers size={13} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                {product.weight || "230 GSM"}
              </span>

              <span className="text-zinc-600">|</span>

              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Users size={13} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                {product.fit || "Unisex"}
              </span>
            </div>

            {/* Color Swatches selection */}
            <div className="h-7 flex items-center pt-1.5">
              {product.variants && product.variants.length > 1 ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
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
                        }}
                        className={`w-4 h-4 rounded-full transition-all border-2 border-black dark:border-white shadow-sm ${
                          selectedVariantIdx === vIdx
                            ? "ring-2 ring-amber-500 dark:ring-amber-400 scale-125 z-10"
                            : "opacity-80 hover:opacity-100 hover:scale-110"
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
        </div>
      </div>
    </motion.article>
  );
}
