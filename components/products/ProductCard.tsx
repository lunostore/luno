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
  const [isAdding, setIsAdding] = useState(false);
  const [isAddedBriefly, setIsAddedBriefly] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const primaryImage = product.mainImage || "/placeholder.jpg";
  const hasHoverImage = Boolean(product.hoverImage && product.hoverImage !== primaryImage);
  const hoverImage = product.hoverImage || primaryImage;

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding) return;

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

    // Shopflex Fly-to-Cart Animation
    const imgEl = imgRef.current;
    const cartBtn = document.getElementById("cartButton") || document.querySelector("header button");

    if (imgEl && cartBtn) {
      setIsAdding(true);
      const imgRect = imgEl.getBoundingClientRect();
      const cartRect = cartBtn.getBoundingClientRect();

      const clone = imgEl.cloneNode(true) as HTMLImageElement;
      Object.assign(clone.style, {
        position: "fixed",
        top: `${imgRect.top}px`,
        left: `${imgRect.left}px`,
        width: `${imgRect.width}px`,
        height: `${imgRect.height}px`,
        zIndex: "99999999",
        opacity: "1",
        pointerEvents: "none",
        transition: "all 0.75s cubic-bezier(0.76, 0, 0.24, 1)",
      });

      document.body.appendChild(clone);

      requestAnimationFrame(() => {
        clone.style.top = `${cartRect.top - imgRect.height * 0.4}px`;
        clone.style.left = `${cartRect.left - imgRect.width * 0.4}px`;
        clone.style.transform = "scale(0.12)";
        clone.style.opacity = "0.2";
      });

      setTimeout(() => {
        if (clone.parentNode) {
          clone.parentNode.removeChild(clone);
        }
        addItem(product, 1, defaultSize, selectedColor);
        setIsAdding(false);
        setIsAddedBriefly(true);
        setTimeout(() => setIsAddedBriefly(false), 1200);
      }, 750);
    } else {
      addItem(product, 1, defaultSize, selectedColor);
      setIsAddedBriefly(true);
      setTimeout(() => setIsAddedBriefly(false), 1200);
    }
  };

  const customScale = product.imageScale ? product.imageScale / 100 : 1;
  const customOffsetY = product.imageOffsetY || 0;

  const handleCardClick = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    openProduct(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{
        duration: 0.4,
        delay: (index % 4) * 0.05,
        ease: [0.76, 0, 0.24, 1],
      }}
      className="w-full h-full relative pt-8 select-none flex flex-col"
    >
      {/* ── EXACT SHOPFLEX CARD CONTAINER (100% IDENTICAL ON MOBILE & PC) ── */}
      <div
        ref={cardRef}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative w-full h-full rounded-[22px] border border-[#cdcdcd] dark:border-zinc-800 hover:border-[#292929] dark:hover:border-zinc-400 transition-[border-color] duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] bg-white dark:bg-[#121214] cursor-pointer overflow-visible flex flex-col justify-between"
        data-cursor-size="80px"
        data-cursor-text="Ver"
      >
        {/* ── TOP IMAGE CONTAINER (UNIFIED 78% RATIO & 88% WIDTH) ── */}
        <div
          ref={imageWrapperRef}
          className="relative w-full pb-[78%] flex justify-center overflow-visible"
        >
          <div
            className="absolute top-0 w-[88%] h-full flex items-center justify-center pointer-events-none"
            style={{
              transform: isHovered
                ? `translateY(calc(-46px + ${customOffsetY}px)) scale(${1.18 * customScale})`
                : `translateY(calc(-6px + ${customOffsetY}px)) scale(${1.02 * customScale})`,
              transition: "transform 0.4s cubic-bezier(0.76, 0, 0.24, 1)",
            }}
          >
            {/* Ambient Floor Shadow under garment */}
            <div
              className={`absolute right-[10%] bottom-[6%] w-[80%] h-[12%] bg-black dark:bg-white/40 rounded-[50%] filter blur-[20px] -z-10 pointer-events-none transition-all duration-400 ${
                isHovered ? "opacity-50 scale-120 translate-y-3" : "opacity-30 scale-100"
              }`}
            />

            <div className="relative w-full h-full flex items-center justify-center">
              {/* Primary Main Image (صورة الغلاف الرئيسية) */}
              <Image
                ref={imgRef}
                src={primaryImage}
                alt={product.name}
                fill
                priority={index < 4}
                quality={95}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className={`object-contain object-center drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] pointer-events-none transition-all duration-400 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                  hasHoverImage && isHovered ? "opacity-0 scale-95" : "opacity-100 scale-100"
                }`}
              />

              {/* Hover Image (صورة الهوفر الثانوية) */}
              {hasHoverImage && (
                <Image
                  src={hoverImage}
                  alt={`${product.name} - hover`}
                  fill
                  quality={95}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className={`object-contain object-center drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] pointer-events-none transition-all duration-400 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                    isHovered ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  }`}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── BOTTOM CONTENT SECTION (UNIFIED PROPORTIONS) ── */}
        <div className="bottom-0 px-4 pb-4 pt-7 relative rounded-b-[22px] overflow-hidden z-10 mt-auto">
          {/* Animated Rising Black Background with Convex Dome Arc on Top */}
          <div
            className={`absolute inset-x-0 bottom-0 h-full pointer-events-none z-0 transition-all duration-400 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              isHovered ? "translate-y-0 opacity-100" : "translate-y-[102%] opacity-0"
            }`}
          >
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="w-full h-full fill-black dark:fill-white stroke-none"
            >
              {/* Prominent convex dome arch at top: peaks at Y=0, sides at Y=20 */}
              <path d="M 0,20 Q 50,0 100,20 L 100,100 L 0,100 Z" />
            </svg>
          </div>

          {/* Title & Price Row */}
          <div className="flex justify-between items-center gap-2 relative z-10 h-[28px]">
            <p
              className={`text-base font-bold max-w-[65%] truncate transition-colors duration-300 delay-75 ${
                isHovered ? "text-white dark:text-black" : "text-black dark:text-white"
              }`}
            >
              {product.name}
            </p>
            <span
              className={`text-sm md:text-base uppercase font-bold whitespace-nowrap transition-colors duration-300 delay-75 ${
                isHovered ? "text-white dark:text-black" : "text-black dark:text-white"
              }`}
            >
              {formatPrice(displayPrice)}
            </span>
          </div>

          {/* Description */}
          <div className="h-[18px] my-1 flex items-center relative z-10">
            <span
              className={`text-xs truncate leading-none transition-colors duration-300 delay-75 ${
                isHovered ? "text-zinc-200 dark:text-zinc-800" : "text-black dark:text-zinc-400"
              }`}
            >
              {product.description || "خامة قطنية فاخرة بتصميم وقصة مريحة"}
            </span>
          </div>

          {/* ── BUTTONS ROW (100% UNIFIED SIZES) ── */}
          <div className="flex justify-between items-center gap-2.5 relative z-10 mt-1">
            {/* Wishlist Button */}
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product);
              }}
              data-cursor-size="0px"
              className="group/btn relative overflow-hidden flex items-center justify-center w-11 h-11 rounded-[12px] border border-[#292929] dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-900 transition-all duration-300 flex-shrink-0 cursor-pointer"
              title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            >
              {/* Normal Icon */}
              <p className="relative top-0 w-full text-center flex justify-center items-center text-[#292929] dark:text-zinc-200 transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:-top-10">
                <Heart
                  size={16}
                  className={`transition-colors ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                />
              </p>

              {/* Hover Expanding Bubble Overlay */}
              <div className="absolute top-[110%] left-0 w-full h-full flex items-center justify-center transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:top-0 pointer-events-none">
                <p className="absolute w-full flex justify-center items-center text-white dark:text-black text-center z-10">
                  <Heart
                    size={16}
                    className={`transition-colors ${
                      isFavorite ? "fill-red-500 text-red-500" : "fill-white text-white dark:fill-black dark:text-black"
                    }`}
                  />
                </p>
                <div className="bg-black dark:bg-white w-[60%] h-full rounded-[50%] transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:w-full group-hover/btn:rounded-[12px]" />
              </div>
            </button>

            {/* Add to Cart Button */}
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleAddToCart}
              data-cursor-size="0px"
              className="group/btn relative overflow-hidden flex-1 h-11 rounded-[12px] border border-[#292929] dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-900 transition-all duration-300 flex items-center justify-center cursor-pointer"
            >
              {/* Normal Text Content */}
              <p className="relative top-0 w-full text-center flex justify-center items-center text-[#292929] dark:text-zinc-200 transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:-top-10 font-bold text-xs md:text-sm">
                {isAddedBriefly ? (
                  <span className="flex items-center gap-1">
                    <Check size={14} className="text-emerald-600 animate-bounce" />
                    <span>تمت الإضافة!</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 sm:gap-1.5">
                    <span>Add to cart</span>
                    <ShoppingCart size={14} />
                  </span>
                )}
              </p>

              {/* Hover Expanding Bubble Overlay */}
              <div className="absolute top-[110%] left-0 w-full h-full flex items-center justify-center transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:top-0 pointer-events-none">
                <p className="absolute w-full flex justify-center items-center text-white dark:text-black text-center z-10 font-bold text-xs md:text-sm">
                  {isAddedBriefly ? (
                    <span className="flex items-center gap-1">
                      <Check size={14} className="text-emerald-400 animate-bounce" />
                      <span>تمت الإضافة!</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 sm:gap-1.5">
                      <span>Add to cart</span>
                      <ShoppingCart size={14} />
                    </span>
                  )}
                </p>
                <div className="bg-black dark:bg-white w-[60%] h-full rounded-[50%] transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:w-full group-hover/btn:rounded-[12px]" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
              {/* Normal Text Content */}
              <p className="relative top-0 w-full text-center flex justify-center items-center text-[#292929] dark:text-zinc-200 transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:-top-10 font-bold text-[11px] sm:text-xs md:text-sm">
                {isAddedBriefly ? (
                  <span className="flex items-center gap-1">
                    <Check size={14} className="text-emerald-600 animate-bounce" />
                    <span>تمت الإضافة!</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 sm:gap-1.5">
                    <span>Add to cart</span>
                    <ShoppingCart size={14} />
                  </span>
                )}
              </p>

              {/* Hover Expanding Bubble Overlay */}
              <div className="absolute top-[110%] left-0 w-full h-full flex items-center justify-center transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:top-0 pointer-events-none">
                <p className="absolute w-full flex justify-center items-center text-white dark:text-black text-center z-10 font-bold text-[11px] sm:text-xs md:text-sm">
                  {isAddedBriefly ? (
                    <span className="flex items-center gap-1">
                      <Check size={14} className="text-emerald-400 animate-bounce" />
                      <span>تمت الإضافة!</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 sm:gap-1.5">
                      <span>Add to cart</span>
                      <ShoppingCart size={14} />
                    </span>
                  )}
                </p>
                <div className="bg-black dark:bg-white w-[60%] h-full rounded-[50%] transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:w-full group-hover/btn:rounded-[9px] sm:group-hover/btn:rounded-[12px]" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

