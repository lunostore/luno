"use client";

import { useState, useRef, MouseEvent } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
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
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // 3D Tilt interactive coordinates
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for fluid physics
  const smoothX = useSpring(mouseX, { stiffness: 220, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 220, damping: 20 });

  // Floating cursor follower ("عرض")
  const cursorX = useMotionValue(100);
  const cursorY = useMotionValue(100);
  const smoothCursorX = useSpring(cursorX, { stiffness: 320, damping: 28 });
  const smoothCursorY = useSpring(cursorY, { stiffness: 320, damping: 28 });

  // 3D Tilt rotations
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);

  const primaryImage = product.mainImage || "/placeholder.jpg";
  const hoverImage = product.hoverImage || product.images?.[0] || primaryImage;
  const currentImage = isHovered ? hoverImage : primaryImage;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);

    if (imageContainerRef.current) {
      const imgRect = imageContainerRef.current.getBoundingClientRect();
      cursorX.set(e.clientX - imgRect.left);
      cursorY.set(e.clientY - imgRect.top);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

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
      className="relative h-full select-none pt-12"
      style={{ perspective: 1200 }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => openProduct(product.id)}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="group relative flex flex-col justify-between h-full bg-white dark:bg-[#121214] rounded-[28px] sm:rounded-[32px] border border-zinc-200/90 dark:border-zinc-800 cursor-pointer shadow-[0_4px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.16)] transition-all duration-500 overflow-visible"
      >
        {/* ── 3D FLOATING PRODUCT VISUAL AREA (POPS OUT OVER TOP) ── */}
        <div
          ref={imageContainerRef}
          className="relative w-full aspect-[1/1.05] sm:aspect-[1/1.08] flex items-center justify-center p-1 sm:p-2 overflow-visible z-30"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* 3D Soft Floor Shadow Under the Shirt */}
          <motion.div
            animate={{
              scale: isHovered ? 1.35 : 1.05,
              opacity: isHovered ? 0.55 : 0.25,
              y: isHovered ? 20 : 0,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[85%] h-9 rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.65)_0%,_rgba(0,0,0,0.15)_50%,_transparent_75%)] dark:bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.4)_0%,_rgba(255,255,255,0.08)_50%,_transparent_75%)] pointer-events-none filter blur-sm z-0"
          />

          {/* Garment Image: Enlarged and pops up on hover */}
          <motion.div
            animate={{
              y: isHovered ? -55 : 0,
              scale: isHovered ? 1.25 : 1.12,
            }}
            transition={{
              type: "spring",
              stiffness: 240,
              damping: 18,
              mass: 0.8,
            }}
            style={{
              transformStyle: "preserve-3d",
              transform: isHovered ? "translateZ(60px)" : "translateZ(15px)",
            }}
            className="relative w-[92%] h-[92%] flex items-center justify-center z-10 pointer-events-none"
          >
            <Image
              key={currentImage}
              src={currentImage}
              alt={product.name}
              fill
              priority={index < 4}
              quality={95}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain object-center drop-shadow-[0_18px_28px_rgba(0,0,0,0.22)] pointer-events-none transition-all duration-500"
            />
          </motion.div>

          {/* Magnetic Cursor Follower ("عرض") */}
          <motion.div
            style={{
              left: smoothCursorX,
              top: smoothCursorY,
              transform: "translate(-50%, -50%) translateZ(75px)",
              pointerEvents: "none",
            }}
            animate={{
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1 : 0.2,
            }}
            transition={{ duration: 0.2 }}
            className="absolute z-40 hidden md:flex items-center justify-center w-14 h-14 rounded-full bg-white/95 dark:bg-zinc-900/95 text-zinc-950 dark:text-white text-xs font-black shadow-2xl border border-zinc-200 dark:border-zinc-700 pointer-events-none"
          >
            عرض
          </motion.div>
        </div>

        {/* ── BOTTOM INFO SECTION (WITH RISING DOME & RECTANGLE ANIMATION) ── */}
        <div className="relative z-20 mt-auto rounded-b-[28px] sm:rounded-b-[32px] overflow-visible">
          {/* Animated Rising Backdrop Curtain with Big Dome Leading from Bottom Up */}
          <motion.div
            initial={false}
            animate={{
              y: isHovered ? 0 : 30,
              scaleY: isHovered ? 1 : 0,
              opacity: isHovered ? 1 : 0,
            }}
            style={{ transformOrigin: "bottom center" }}
            transition={{
              type: "spring",
              stiffness: 240,
              damping: 22,
              mass: 0.7,
            }}
            className="absolute inset-x-0 bottom-0 top-0 bg-black dark:bg-white z-0 pointer-events-none rounded-b-[28px] sm:rounded-b-[32px] overflow-visible shadow-2xl"
          >
            {/* The High Semi-Circle Dome Header on Top of the Rising Layer (Never Clipped) */}
            <div className="absolute -top-20 sm:-top-24 md:-top-28 left-0 right-0 h-20 sm:h-24 md:h-28 overflow-visible pointer-events-none">
              <svg
                className="w-full h-full text-black dark:text-white fill-current"
                viewBox="0 0 100 55"
                preserveAspectRatio="none"
              >
                <path d="M 0,55 Q 50,0 100,55 Z" />
              </svg>
            </div>
          </motion.div>

          {/* Content Layer (Text & Action Buttons) */}
          <div className="relative px-5 pb-5 pt-4 z-10 flex flex-col justify-between transition-colors duration-400">
            {/* Product Title & Price */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center justify-between gap-2">
                <h3
                  className={`font-black text-sm sm:text-base tracking-tight line-clamp-1 transition-colors duration-300 ${
                    isHovered ? "text-white dark:text-black" : "text-zinc-900 dark:text-white"
                  }`}
                >
                  {product.name}
                </h3>
                <span
                  className={`font-black text-sm sm:text-base whitespace-nowrap transition-colors duration-300 ${
                    isHovered ? "text-white dark:text-black" : "text-zinc-900 dark:text-white"
                  }`}
                >
                  {formatPrice(displayPrice)}
                </span>
              </div>

              {/* Description */}
              <p
                className={`text-[11px] sm:text-xs line-clamp-2 leading-relaxed transition-colors duration-300 ${
                  isHovered ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {product.description || product.subtitle || "Our premium collection in high-density cotton"}
              </p>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center gap-2">
              {/* Wishlist Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product);
                }}
                className={`w-10 h-10 rounded-xl transition-all duration-300 flex items-center justify-center flex-shrink-0 ${
                  isHovered
                    ? "bg-transparent text-white border-zinc-700 hover:border-zinc-500 dark:text-black dark:border-zinc-300 dark:hover:border-zinc-500"
                    : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                }`}
                title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
              >
                <Heart
                  size={16}
                  className={`transition-colors ${
                    isFavorite ? "fill-red-500 text-red-500" : "currentColor"
                  }`}
                />
              </button>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-1 h-10 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 shadow-sm ${
                  isHovered
                    ? isAddedBriefly
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-black hover:bg-zinc-100 dark:bg-black dark:text-white dark:hover:bg-zinc-800 shadow-md font-extrabold"
                    : isAddedBriefly
                    ? "bg-emerald-600 text-white"
                    : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                {isAddedBriefly ? (
                  <>
                    <Check size={16} className="animate-bounce" />
                    <span>تمت الإضافة!</span>
                  </>
                ) : (
                  <>
                    <span>Add to cart</span>
                    <ShoppingCart size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.article>
  );
}
