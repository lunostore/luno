"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Eye, Heart } from "lucide-react";
import { useWishlist } from "@/features/wishlist/WishlistProvider";
import { formatPrice, getDiscountPercentage } from "@/lib/utils";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const router = useRouter();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isFavorite = isInWishlist(product.id);
  const displayPrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPct = hasDiscount
    ? getDiscountPercentage(product.price, product.salePrice!)
    : 0;

  const staggerDelay = (index % 4) * 0.08;

  // Find second image for hover effect (explicit hoverImage, images array, or variant image)
  const secondImage =
    product.hoverImage ||
    (product.images && product.images.length > 1 ? product.images[1] : null) ||
    product.variants?.find((v) => v.image && v.image !== product.mainImage)?.image ||
    (product.variants && product.variants.length > 1 ? product.variants[1]?.image : null) ||
    null;

  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const activeVariant = product.variants?.[selectedVariantIdx] || null;

  // Get active images array for the active variant or product
  const activeColorImages = activeVariant?.images && activeVariant.images.length > 0
    ? activeVariant.images
    : activeVariant?.image
    ? [activeVariant.image]
    : [product.mainImage, product.hoverImage, ...(product.images || [])].filter(Boolean) as string[];

  const primaryDisplayImage = activeColorImages[0] || product.mainImage || "/placeholder.jpg";
  const secondaryDisplayImage = activeColorImages[1] || secondImage || null;

  // Navigate by Firestore Document ID (always unique — never use slug)
  const navigateToProduct = () => {
    router.push(`/products?id=${encodeURIComponent(product.id)}`);
  };

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
      whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
    >
      {/* Outer wrapper — NO nested buttons, NO role=button on div */}
      <div className="block group cursor-pointer select-none" onClick={navigateToProduct}>

        {/* Floating Image Container */}
        <div className="relative overflow-visible">

          {/* Wishlist Heart Button — stops propagation so card click doesn't fire */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/30 dark:bg-white/10 backdrop-blur-md text-white hover:text-red-400 hover:scale-110 active:scale-95 transition-all shadow-lg"
            title={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={14} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
          </button>

          {/* Discount & Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
            {hasDiscount && (
              <span className="bg-red-500 text-white text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md">
                -{discountPct}%
              </span>
            )}
            {product.bestSeller && (
              <span className="bg-amber-400 text-black text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md">
                Best Seller
              </span>
            )}
          </div>

          {/* Quick View Overlay */}
          <div className="absolute inset-0 z-10 flex items-end justify-center pb-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <motion.span
              className="flex items-center gap-2 bg-black/80 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl backdrop-blur-sm"
              initial={{ y: 10, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
            >
              <Eye size={13} />
              عرض المنتج
            </motion.span>
          </div>

          {/* Product Image Container */}
          <div className="aspect-[3/4] relative overflow-hidden rounded-2xl">
            {primaryDisplayImage ? (
              <motion.div
                className="w-full h-full relative"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Main Primary Image */}
                <Image
                  key={primaryDisplayImage}
                  src={primaryDisplayImage}
                  alt={product.name}
                  fill
                  priority={index < 4}
                  quality={95}
                  crossOrigin="anonymous"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`object-contain object-top transition-all duration-500 ease-in-out ${
                    secondaryDisplayImage ? "group-hover:opacity-0" : ""
                  }`}
                />

                {/* Second Hover Image (if available) */}
                {secondaryDisplayImage && (
                  <Image
                    key={secondaryDisplayImage}
                    src={secondaryDisplayImage}
                    alt={`${product.name} hover view`}
                    fill
                    quality={95}
                    crossOrigin="anonymous"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-contain object-top opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out absolute inset-0"
                  />
                )}
              </motion.div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-zinc-400 dark:text-zinc-600 text-4xl font-black">LUNO</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="pt-4 text-center space-y-2 px-1">
          {/* Color swatches */}
          {product.variants && product.variants.length > 0 && (
            <div className="flex items-center justify-center gap-2 mb-1.5">
              {product.variants.slice(0, 6).map((variant, vIdx) => (
                <button
                  key={variant.colorHex + vIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVariantIdx(vIdx);
                  }}
                  className={`w-4 h-4 rounded-full transition-all duration-200 shadow-sm border ${
                    selectedVariantIdx === vIdx
                      ? "ring-2 ring-zinc-900 dark:ring-white scale-125 z-10"
                      : "opacity-80 hover:opacity-100 hover:scale-110"
                  }`}
                  style={{ backgroundColor: variant.colorHex }}
                  title={variant.colorName}
                />
              ))}
              {product.variants.length > 6 && (
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">
                  +{product.variants.length - 6}
                </span>
              )}
            </div>
          )}

          <h3 className="text-sm sm:text-base md:text-lg font-black text-zinc-900 dark:text-white tracking-wide leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center justify-center gap-2">
            <span className="text-sm sm:text-base font-black text-zinc-900 dark:text-white">
              {formatPrice(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400 line-through font-semibold">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
