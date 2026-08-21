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

  // Smooth springs for fluid 3D physics
  const smoothX = useSpring(mouseX, { stiffness: 220, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 220, damping: 20 });

  // Floating cursor follower coordinates ("Ver" / "عرض")
  const cursorX = useMotionValue(100);
  const cursorY = useMotionValue(100);
  const smoothCursorX = useSpring(cursorX, { stiffness: 300, damping: 26 });
  const smoothCursorY = useSpring(cursorY, { stiffness: 300, damping: 26 });

  // 3D transformations
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);
  const garmentFloatY = useTransform(smoothY, [-0.5, 0.5], [-26, -16]);

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
      className="relative h-full select-none"
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
        className="group relative flex flex-col justify-between h-full bg-white dark:bg-[#121214] rounded-[28px] sm:rounded-[32px] border border-zinc-200/90 dark:border-zinc-800 overflow-hidden cursor-pointer shadow-[0_4px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.14)] transition-shadow duration-500"
      >
        {/* ── 3D FLOATING PRODUCT VISUAL AREA ── */}
        <div
          ref={imageContainerRef}
          className="relative w-full aspect-[4/4.6] flex items-center justify-center p-5 pt-8 overflow-visible z-10"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* 3D Realistic Soft Floor Shadow */}
          <motion.div
            animate={{
              scale: isHovered ? 1.15 : 0.95,
              opacity: isHovered ? 0.45 : 0.25,
              y: isHovered ? 10 : 0,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[70%] h-8 rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.55)_0%,_rgba(0,0,0,0.15)_50%,_transparent_75%)] pointer-events-none filter blur-sm"
          />

          {/* Floating Transparent PNG Garment (Elevates & Scales Up on Hover) */}
          <motion.div
            style={{
              y: isHovered ? garmentFloatY : 0,
              transformStyle: "preserve-3d",
              transform: isHovered
                ? "translateZ(45px) scale(1.08)"
                : "translateZ(15px) scale(1)",
            }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="relative w-full h-full flex items-center justify-center"
          >
            <Image
              key={currentImage}
              src={currentImage}
              alt={product.name}
              fill
              priority={index < 4}
              quality={95}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain object-center drop-shadow-[0_12px_20px_rgba(0,0,0,0.12)] pointer-events-none transition-transform duration-500"
            />
          </motion.div>

          {/* Magnetic Circular Cursor Follower ("عرض" / "Ver") */}
          <motion.div
            style={{
              left: smoothCursorX,
              top: smoothCursorY,
              transform: "translate(-50%, -50%) translateZ(60px)",
              pointerEvents: "none",
            }}
            animate={{
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1 : 0.3,
            }}
            transition={{ duration: 0.2 }}
            className="absolute z-40 hidden md:flex items-center justify-center w-14 h-14 rounded-full bg-white/95 text-zinc-900 text-xs font-black shadow-2xl border border-zinc-200/80 pointer-events-none tracking-tight"
          >
            عرض
          </motion.div>
        </div>

        {/* ── BOTTOM INFO SECTION WITH DOME CURVE (قوس القبة الصاعد) ── */}
        <div className="relative z-20 mt-auto overflow-hidden">
          {/* Black Dome Background Layer */}
          <div
            className={`relative transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] px-5 pb-5 pt-7 flex flex-col justify-between ${
              isHovered
                ? "bg-black text-white"
                : "bg-white dark:bg-[#121214] text-zinc-900 dark:text-white"
            }`}
          >
            {/* Convex Dome Arch (القوس المنحني لأعلى كما بالصورة تماماً) */}
            {isHovered && (
              <svg
                className="absolute -top-7 left-0 w-full h-8 text-black fill-current pointer-events-none"
                viewBox="0 0 100 30"
                preserveAspectRatio="none"
              >
                <path d="M 0,30 Q 50,0 100,30 L 100,30 L 0,30 Z" />
              </svg>
            )}

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

            {/* Bottom Actions Row: Wishlist + Add to Cart */}
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
