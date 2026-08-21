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
        {/* ── 3D FLOATING PRODUCT VISUAL AREA ── */}
        <div
          ref={imageContainerRef}
          className="relative w-full aspect-[4/4.2] flex items-center justify-center p-3 overflow-visible z-30"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* 3D Soft Floor Shadow Under the Shirt */}
          <motion.div
            animate={{
              scale: isHovered ? 1.25 : 0.95,
              opacity: isHovered ? 0.5 : 0.22,
              y: isHovered ? 18 : 0,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[74%] h-8 rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.65)_0%,_rgba(0,0,0,0.15)_50%,_transparent_75%)] pointer-events-none filter blur-sm z-0"
          />

          {/* Garment Image: Pops up and flies out of top of card */}
          <motion.div
            animate={{
              y: isHovered ? -52 : 0,
              scale: isHovered ? 1.18 : 1,
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
            className="relative w-full h-full flex items-center justify-center z-10 pointer-events-none"
          >
            <Image
              key={currentImage}
              src={currentImage}
              alt={product.name}
              fill
              priority={index < 4}
              quality={95}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain object-center drop-shadow-[0_16px_25px_rgba(0,0,0,0.2)] pointer-events-none transition-all duration-500"
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
            className="absolute z-40 hidden md:flex items-center justify-center w-14 h-14 rounded-full bg-white/95 text-zinc-950 text-xs font-black shadow-2xl border border-zinc-200 pointer-events-none"
          >
            عرض
          </motion.div>
        </div>

        {/* ── BOTTOM INFO SECTION WITH HUGE DOME ABOVE RECTANGLE ── */}
        <div className="relative z-20 mt-auto overflow-visible">
          {/* Big Black Semi-Circle Dome Rising High ABOVE the Rectangle */}
          <div
            className={`absolute -top-16 sm:-top-20 left-0 right-0 h-16 sm:h-20 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-10 ${
              isHovered
                ? "opacity-100 translate-y-0 scale-y-100"
                : "opacity-0 translate-y-6 scale-y-50"
            }`}
            style={{ transformOrigin: "bottom center" }}
          >
            <svg
              className="w-full h-full text-black fill-current"
              viewBox="0 0 100 45"
              preserveAspectRatio="none"
            >
              {/* Massive smooth continuous circular dome arc */}
              <path d="M 0,45 Q 50,0 100,45 Z" />
            </svg>
          </div>

          {/* Base Rectangle Content Container */}
          <div
            className={`relative transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] px-5 pb-5 pt-4 rounded-b-[28px] sm:rounded-b-[32px] flex flex-col justify-between z-20 ${
              isHovered
                ? "bg-black text-white shadow-2xl"
                : "bg-white dark:bg-[#121214] text-zinc-900 dark:text-white"
            }`}
          >
            {/* Product Title & Price */}
            <div className="relative z-10 space-y-1.5 mb-4">
              <div className="flex items-center justify-between gap-2">
                <h3
                  className={`font-black text-sm sm:text-base tracking-tight line-clamp-1 transition-colors duration-300 ${
                    isHovered ? "text-white" : "text-zinc-900 dark:text-white"
                  }`}
                >
                  {product.name}
                </h3>
                <span
                  className={`font-black text-sm sm:text-base whitespace-nowrap transition-colors duration-300 ${
                    isHovered ? "text-white" : "text-zinc-900 dark:text-white"
                  }`}
                >
                  {formatPrice(displayPrice)}
                </span>
              </div>

              {/* Description */}
              <p
                className={`text-[11px] sm:text-xs line-clamp-2 leading-relaxed transition-colors duration-300 ${
                  isHovered ? "text-zinc-400" : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {product.description || product.subtitle || "Our premium collection in high-density cotton"}
              </p>
            </div>

            {/* Bottom Actions Row */}
            <div className="relative z-10 flex items-center gap-2">
              {/* Wishlist Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product);
                }}
                className={`w-10 h-10 rounded-xl transition-all duration-300 flex items-center justify-center flex-shrink-0 ${
                  isHovered
                    ? "bg-transparent text-white border border-zinc-700 hover:border-zinc-500"
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
                      : "bg-white text-black hover:bg-zinc-100 shadow-md font-extrabold"
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
