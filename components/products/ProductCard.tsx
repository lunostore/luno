"use client";

import { useState, useRef, MouseEvent } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Check } from "lucide-react";
import { useWishlist } from "@/features/wishlist/WishlistProvider";
import { useProductModal } from "@/features/product-modal/ProductModalProvider";
import { useCart } from "@/features/cart/CartProvider";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { openProduct } = useProductModal();
  const { addItem } = useCart();

  const isFavorite = isInWishlist(product.id);
  const displayPrice = product.salePrice ?? product.price;

  const [isHovered, setIsHovered] = useState(false);
  const [isAddedBriefly, setIsAddedBriefly] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const primaryImage = product.mainImage || "/placeholder.jpg";
  const hoverImage = product.hoverImage || product.images?.[0] || primaryImage;
  const currentImage = isHovered ? hoverImage : primaryImage;

  const handleAddToCart = (e: MouseEvent) => {
    e.stopPropagation();

    const targetVariant = product.variants?.[0];
    const availableSizes = targetVariant?.sizes || [];

    if (availableSizes.length > 1 || (product.variants?.length ?? 0) > 1) {
      openProduct(product.id);
      return;
    }

    const defaultSize = availableSizes[0]?.size || "M";
    const selectedColor = targetVariant
      ? {
          name: targetVariant.colorName || "افتراضي",
          hex: targetVariant.colorHex || "#000000",
          image: targetVariant.image || product.mainImage || "",
        }
      : {
          name: "افتراضي",
          hex: "#000000",
          image: product.mainImage || "",
        };

    addItem(product, 1, defaultSize, selectedColor);
    setIsAddedBriefly(true);
    setTimeout(() => setIsAddedBriefly(false), 1400);
  };

  const customScale = product.imageScale ? product.imageScale / 100 : 1;
  const customOffsetY = product.imageOffsetY || 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.55,
        delay: (index % 4) * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative h-full select-none"
    >
      <div
        ref={cardRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => openProduct(product.id)}
        className="group relative w-full max-w-[340px] mx-auto h-[530px] rounded-[25px] border border-[#CDCDCD] dark:border-zinc-800 hover:border-[#292929] dark:hover:border-zinc-500 transition-all duration-300 overflow-hidden flex flex-col bg-white dark:bg-[#121214] cursor-pointer shadow-[0_4px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.16)]"
      >
        {/* ── 1. PRODUCT IMAGE CONTAINER & HOVER POP-UP ── */}
        <div className="relative w-full aspect-square flex items-center justify-center p-4 overflow-visible">
          <div
            className="relative w-full h-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] pointer-events-none"
            style={{
              transform: isHovered
                ? `translateY(calc(-28px + ${customOffsetY}px)) scale(${1.12 * customScale})`
                : `translateY(${customOffsetY}px) scale(${1.0 * customScale})`,
            }}
          >
            {/* Real Soft Floor Shadow Under Garment */}
            <div
              className={`absolute w-[72%] h-[12%] bg-black dark:bg-white/30 rounded-[50%] filter blur-[20px] bottom-[4%] left-[14%] -z-10 pointer-events-none transition-all duration-500 ${
                isHovered ? "opacity-50 scale-110" : "opacity-35 scale-100"
              }`}
            />

            <div className="relative w-[260px] h-[260px] flex items-center justify-center">
              <Image
                src={currentImage}
                alt={product.name}
                fill
                priority={index < 4}
                quality={95}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-contain object-center drop-shadow-[0_16px_24px_rgba(0,0,0,0.16)] transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* ── 2. BOTTOM CONTENT SECTION (TEXT & RISING CONVEX DOME SHEET) ── */}
        <div className="relative mt-auto px-6 pb-6 pt-3 flex flex-col z-10 overflow-visible transition-colors duration-300">
          {/* Animated Rising Sheet with Prominent Convex Arc Dome on Top */}
          <div
            className="absolute inset-x-0 bottom-0 bg-black dark:bg-white -z-10 pointer-events-none transition-all duration-400 ease-[cubic-bezier(0.76,0,0.24,1)]"
            style={{
              height: isHovered ? "100%" : "0%",
              top: isHovered ? "0%" : "100%",
            }}
          >
            {/* Wide Convex Dome SVG Curve Leading the Rising Sheet */}
            <div className="absolute bottom-full left-0 right-0 h-[48px] sm:h-[56px] overflow-visible pointer-events-none">
              <svg
                className="w-full h-full text-black dark:text-white fill-current"
                viewBox="0 0 100 28"
                preserveAspectRatio="none"
              >
                {/* Smooth, panoramic convex dome arc curve */}
                <path d="M 0,28 Q 50,0 100,28 Z" />
              </svg>
            </div>
          </div>

          {/* Product Title & Price */}
          <div className="flex justify-between items-start gap-3 relative z-10">
            <h3 className="text-xl sm:text-2xl font-black text-black dark:text-white transition-colors duration-300 group-hover:text-white dark:group-hover:text-black max-w-[70%] truncate tracking-tight">
              {product.name}
            </h3>
            <span className="text-lg sm:text-xl font-black text-black dark:text-white transition-colors duration-300 group-hover:text-white dark:group-hover:text-black whitespace-nowrap">
              {formatPrice(displayPrice)}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 my-2.5 line-clamp-2 transition-colors duration-300 group-hover:text-gray-300 dark:group-hover:text-zinc-700 leading-relaxed relative z-10">
            {product.description || "Our premium collection in high-density cotton"}
          </p>

          {/* ── 3. INTERACTIVE BUBBLE-EXPANDING BUTTONS ── */}
          <div className="flex justify-between items-center gap-3 mt-2 relative z-10">
            {/* Wishlist / Heart Button */}
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product);
              }}
              className="group/btn relative overflow-hidden flex items-center justify-center w-11 h-11 border border-[#292929] dark:border-zinc-700 bg-[#F9F9F9] dark:bg-zinc-900 transition-all duration-300 rounded-[15px] hover:border-black dark:hover:border-white active:scale-95 flex-shrink-0 cursor-pointer"
              title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            >
              {/* Normal State Icon */}
              <span className="relative top-0 flex items-center justify-center text-[#292929] dark:text-zinc-200 transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:-translate-y-10">
                <Heart
                  size={19}
                  className={`transition-colors ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                />
              </span>

              {/* Hover Bubble Container */}
              <div className="absolute top-[110%] left-0 w-full h-full flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:top-0 z-10 pointer-events-none">
                <span className="absolute text-white dark:text-black z-20 flex items-center justify-center">
                  <Heart
                    size={19}
                    className={`transition-colors ${
                      isFavorite ? "fill-red-500 text-red-500" : "fill-white text-white dark:fill-black dark:text-black"
                    }`}
                  />
                </span>
                {/* Expanding Bubble */}
                <div className="absolute bg-black dark:bg-white w-[60%] h-full rounded-[50%] transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:w-full group-hover/btn:rounded-[15px]" />
              </div>
            </button>

            {/* Add to Cart Button */}
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleAddToCart}
              className="group/btn relative overflow-hidden flex-1 h-11 border border-[#292929] dark:border-zinc-700 bg-[#F9F9F9] dark:bg-zinc-900 transition-all duration-300 rounded-[15px] hover:border-black dark:hover:border-white active:scale-95 flex items-center justify-center cursor-pointer"
            >
              {/* Normal State Content */}
              <span className="relative top-0 flex items-center justify-center gap-2 text-xs sm:text-sm font-black text-[#292929] dark:text-zinc-200 transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:-translate-y-10">
                {isAddedBriefly ? (
                  <>
                    <Check size={16} className="text-emerald-600 animate-bounce" />
                    <span>تمت الإضافة!</span>
                  </>
                ) : (
                  <>
                    <span>Add to cart</span>
                    <ShoppingCart size={16} />
                  </>
                )}
              </span>

              {/* Hover Bubble Container */}
              <div className="absolute top-[110%] left-0 w-full h-full flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:top-0 z-10 pointer-events-none">
                <span className="absolute text-white dark:text-black z-20 flex items-center justify-center gap-2 text-xs sm:text-sm font-black">
                  {isAddedBriefly ? (
                    <>
                      <Check size={16} className="text-emerald-400 animate-bounce" />
                      <span>تمت الإضافة!</span>
                    </>
                  ) : (
                    <>
                      <span>Add to cart</span>
                      <ShoppingCart size={16} />
                    </>
                  )}
                </span>
                {/* Expanding Bubble */}
                <div className="absolute bg-black dark:bg-white w-[60%] h-full rounded-[50%] transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:w-full group-hover/btn:rounded-[15px]" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
