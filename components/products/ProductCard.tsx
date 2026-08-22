"use client";

import { useState, useRef, useEffect, MouseEvent } from "react";
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
  const [cardWidth, setCardWidth] = useState(330);

  const cardRef = useRef<HTMLDivElement>(null);

  // ResizeObserver to dynamically update SVG Curve width to match exact card width
  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCardWidth(Math.floor(entry.contentRect.width));
      }
    });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

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

  // Exact Dynamic SVG curve path equation from Shopflex
  const curveY = isHovered ? 98.8 : 100;
  const curvePath = `M0 100 L0 200 L${cardWidth} 200 L${cardWidth} 100 Q${cardWidth / 2} ${curveY} 0 100`;

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
        className="group relative w-full max-w-[340px] mx-auto h-[528px] rounded-[25px] border border-[#CDCDCD] dark:border-zinc-800 hover:border-[#292929] dark:hover:border-zinc-500 transition-all duration-300 overflow-visible flex flex-col bg-white dark:bg-[#121214] cursor-pointer shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.14)]"
      >
        {/* ── 1. PRODUCT IMAGE CONTAINER & HOVER POP-OUT ── */}
        <div className="relative w-full pb-[100%] flex justify-center overflow-visible">
          <div
            className="absolute left-[22.5px] right-[22.5px] top-0 bottom-0 transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] flex items-center justify-center z-10 pointer-events-none"
            style={{
              top: isHovered ? `calc(-20% + ${customOffsetY}px)` : `${customOffsetY}px`,
              transform: isHovered ? `scale(${1.1 * customScale})` : `scale(${1.0 * customScale})`,
            }}
          >
            {/* Real Floor Soft Blur Shadow Under Garment */}
            <div className="absolute w-[72%] h-[10%] bg-black dark:bg-white/30 rounded-[50%] filter blur-[22px] opacity-40 bottom-[10%] left-[14%] -z-10 pointer-events-none transition-opacity duration-300" />

            <div className="relative w-[280px] h-[280px] flex items-center justify-center">
              <Image
                src={currentImage}
                alt={product.name}
                fill
                priority={index < 4}
                quality={95}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-contain object-center drop-shadow-[0_16px_24px_rgba(0,0,0,0.18)] transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* ── 2. BOTTOM CONTENT SECTION (TEXT & RISING SVG CURVE) ── */}
        <div className="relative mt-auto p-6 flex flex-col z-10 overflow-hidden rounded-b-[25px] transition-all duration-300">
          {/* Black Sheet Rising from Bottom */}
          <div
            className="absolute bottom-0 left-0 w-full bg-black dark:bg-white -z-10 transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] pointer-events-none"
            style={{ height: isHovered ? "56%" : "0%" }}
          />

          {/* Dynamic SVG Curve Leading the Rising Sheet */}
          <svg
            className="absolute left-0 w-full h-[150px] -z-10 transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] pointer-events-none text-black dark:text-white fill-current"
            style={{ bottom: isHovered ? "55%" : "-40%" }}
          >
            <path d={curvePath} stroke="none" className="transition-all duration-300" />
          </svg>

          {/* Product Title & Price */}
          <div className="flex justify-between items-start gap-3">
            <h3 className="text-xl sm:text-2xl font-bold text-black dark:text-white transition-colors duration-300 group-hover:text-white dark:group-hover:text-black max-w-[70%] truncate tracking-tight">
              {product.name}
            </h3>
            <span className="text-lg sm:text-xl font-bold text-black dark:text-white transition-colors duration-300 group-hover:text-white dark:group-hover:text-black whitespace-nowrap">
              {formatPrice(displayPrice)}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 my-2.5 line-clamp-2 transition-colors duration-300 group-hover:text-gray-300 dark:group-hover:text-zinc-700 leading-relaxed">
            {product.description || "Our premium collection in high-density cotton"}
          </p>

          {/* ── 3. INTERACTIVE BUBBLE-EXPANDING BUTTONS ── */}
          <div className="flex justify-between items-center gap-3 mt-2">
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
              className="group/btn relative overflow-hidden flex items-center justify-center w-11 h-11 border border-[#292929] dark:border-zinc-700 bg-[#F9F9F9] dark:bg-zinc-900 transition-all duration-300 rounded-[15px] hover:border-white active:scale-95 flex-shrink-0 cursor-pointer"
              title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            >
              {/* Normal State Icon */}
              <span className="relative top-0 flex items-center justify-center text-[#292929] dark:text-zinc-200 transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:-translate-y-10">
                <Heart
                  size={19}
                  className={`transition-colors ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                />
              </span>

              {/* Hover Bubble Container */}
              <div className="absolute top-[110%] left-0 w-full h-full flex items-center justify-center transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:top-0 z-10 pointer-events-none">
                <span className="absolute text-white dark:text-black z-20 flex items-center justify-center">
                  <Heart
                    size={19}
                    className={`transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "fill-white text-white dark:fill-black dark:text-black"}`}
                  />
                </span>
                {/* Expanding Bubble */}
                <div className="absolute bg-black dark:bg-white w-[60%] h-full rounded-[50%] transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:w-full group-hover/btn:rounded-[15px]" />
              </div>
            </button>

            {/* Add to Cart Button */}
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleAddToCart}
              className="group/btn relative overflow-hidden flex-1 h-11 border border-[#292929] dark:border-zinc-700 bg-[#F9F9F9] dark:bg-zinc-900 transition-all duration-300 rounded-[15px] hover:border-white active:scale-95 flex items-center justify-center cursor-pointer"
            >
              {/* Normal State Content */}
              <span className="relative top-0 flex items-center justify-center gap-2 text-xs sm:text-sm font-black text-[#292929] dark:text-zinc-200 transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:-translate-y-10">
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
              <div className="absolute top-[110%] left-0 w-full h-full flex items-center justify-center transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:top-0 z-10 pointer-events-none">
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
                <div className="absolute bg-black dark:bg-white w-[60%] h-full rounded-[50%] transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:w-full group-hover/btn:rounded-[15px]" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
