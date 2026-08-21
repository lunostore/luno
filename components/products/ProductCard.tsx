"use client";

import { useState, useRef, MouseEvent } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Eye, Shirt, Layers, Users, Sparkles, Check } from "lucide-react";
import { useWishlist } from "@/features/wishlist/WishlistProvider";
import { useProductModal } from "@/features/product-modal/ProductModalProvider";
import { useCart } from "@/features/cart/CartProvider";
import { formatPrice, getDiscountPercentage } from "@/lib/utils";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { openProduct } = useProductModal();
  const { addItem, openCart } = useCart();

  const isFavorite = isInWishlist(product.id);
  const displayPrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPct = hasDiscount
    ? getDiscountPercentage(product.price, product.salePrice!)
    : 0;

  const [isHovered, setIsHovered] = useState(false);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null);
  const [isAddedBriefly, setIsAddedBriefly] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const imageAreaRef = useRef<HTMLDivElement>(null);

  // 3D Tilt Motion Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Magnetic cursor follower for image preview badge ("عرض" / "View")
  const badgeX = useMotionValue(0);
  const badgeY = useMotionValue(0);

  const springConfig = { damping: 22, stiffness: 220 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);
  const smoothBadgeX = useSpring(badgeX, { damping: 28, stiffness: 300 });
  const smoothBadgeY = useSpring(badgeY, { damping: 28, stiffness: 300 });

  // 3D dynamic rotation calculations
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-10, 10]);
  const itemElevateY = useTransform(smoothY, [-0.5, 0.5], [-14, -4]);
  const shadowScale = useTransform(smoothY, [-0.5, 0.5], [0.85, 1.15]);

  const activeVariant =
    selectedVariantIdx !== null && product.variants?.[selectedVariantIdx]
      ? product.variants[selectedVariantIdx]
      : null;

  const secondImage =
    product.hoverImage ||
    (product.images && product.images.length > 0 ? product.images[0] : null) ||
    null;

  const basePrimaryImage =
    (activeVariant && activeVariant.image) || product.mainImage || "/placeholder.jpg";

  const currentDisplayImage =
    isHovered && secondImage ? secondImage : basePrimaryImage;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);

    if (imageAreaRef.current) {
      const imgRect = imageAreaRef.current.getBoundingClientRect();
      badgeX.set(e.clientX - imgRect.left);
      badgeY.set(e.clientY - imgRect.top);
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

  const handleQuickAddToCart = (e: MouseEvent) => {
    e.stopPropagation();
    
    // Check if product requires modal selection for sizes/variants
    const hasMultipleSizes = (product.sizes?.length ?? 0) > 1;
    const hasMultipleVariants = (product.variants?.length ?? 0) > 1;

    if (hasMultipleSizes || (hasMultipleVariants && selectedVariantIdx === null)) {
      openProduct(product.id);
      return;
    }

    const defaultSize = product.sizes?.[0] || "M";
    const selectedColor = activeVariant
      ? {
          name: activeVariant.colorName || "افتراضي",
          hex: activeVariant.colorHex || "#000000",
          image: activeVariant.image || product.mainImage || "",
        }
      : {
          name: product.variants?.[0]?.colorName || "افتراضي",
          hex: product.variants?.[0]?.colorHex || "#000000",
          image: product.mainImage || "",
        };

    addItem(product, 1, defaultSize, selectedColor);
    setIsAddedBriefly(true);
    setTimeout(() => setIsAddedBriefly(false), 1400);
  };

  const isNewProduct =
    product.isNew ||
    (product.createdAt &&
      new Date().getTime() - new Date(product.createdAt.toString()).getTime() <
        14 * 24 * 60 * 60 * 1000);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.6,
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
        className="group relative flex flex-col justify-between h-full bg-[#f6f6f7] dark:bg-[#121214] rounded-[28px] sm:rounded-[32px] border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-[border-color,box-shadow] duration-500"
      >
        {/* Top Badges & Actions */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-30 pointer-events-none">
          {/* Status Badges */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {isNewProduct ? (
              <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase px-2.5 py-1 rounded-full bg-black/90 text-white dark:bg-white dark:text-black shadow-sm flex items-center gap-1 backdrop-blur-md">
                <Sparkles size={11} className="text-amber-400" />
                NEW
              </span>
            ) : hasDiscount ? (
              <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase px-2.5 py-1 rounded-full bg-red-600 text-white shadow-sm">
                -{discountPct}%
              </span>
            ) : product.bestSeller ? (
              <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase px-2.5 py-1 rounded-full bg-amber-500 text-black font-extrabold shadow-sm">
                BEST SELLER
              </span>
            ) : null}
          </div>

          {/* Wishlist Button (Always accessible) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className="w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-200 flex items-center justify-center pointer-events-auto transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md border border-zinc-200/60 dark:border-zinc-700/60 backdrop-blur-md"
            title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            <Heart
              size={16}
              className={`transition-colors ${
                isFavorite ? "fill-red-500 text-red-500" : "text-zinc-700 dark:text-zinc-300"
              }`}
            />
          </button>
        </div>

        {/* ── 3D FLOATING PRODUCT IMAGE & FLOOR SHADOW ── */}
        <div
          ref={imageAreaRef}
          className="relative w-full aspect-[4/4.2] sm:aspect-[4/4.4] flex items-center justify-center p-4 pt-10 overflow-hidden"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Realistic 3D Elliptical Floor Drop Shadow */}
          <motion.div
            style={{
              scaleX: shadowScale,
              transformStyle: "preserve-3d",
              transform: "translateZ(5px)",
            }}
            animate={{
              scale: isHovered ? 1.08 : 0.95,
              opacity: isHovered ? 0.45 : 0.28,
              y: isHovered ? 6 : 0,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 w-3/5 h-5 rounded-[100%] bg-black blur-md pointer-events-none dark:opacity-60"
          />

          {/* Floating Garment Container */}
          <motion.div
            style={{
              y: isHovered ? itemElevateY : 0,
              transformStyle: "preserve-3d",
              transform: isHovered
                ? "translateZ(45px) scale(1.05)"
                : "translateZ(20px) scale(1)",
            }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative w-full h-full flex items-center justify-center"
          >
            <Image
              key={currentDisplayImage}
              src={currentDisplayImage}
              alt={product.name}
              fill
              priority={index < 4}
              quality={95}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain object-center drop-shadow-md transition-transform duration-500 pointer-events-none"
            />
          </motion.div>

          {/* Magnetic Follower Badge ("عرض" / "View") */}
          <motion.div
            style={{
              left: smoothBadgeX,
              top: smoothBadgeY,
              transform: "translate(-50%, -50%) translateZ(60px)",
              pointerEvents: "none",
            }}
            animate={{
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1 : 0.4,
            }}
            transition={{ duration: 0.2 }}
            className="absolute z-40 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-white text-xs font-black shadow-xl backdrop-blur-md border border-zinc-200/80 dark:border-zinc-700/80"
          >
            عرض
          </motion.div>
        </div>

        {/* ── BOTTOM INFO & CURVED DOME HOVER SECTION ── */}
        <div className="relative z-20 mt-auto">
          {/* Curved Dome Dark Transition Background */}
          <div
            className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] p-4 sm:p-5 flex flex-col justify-between ${
              isHovered
                ? "bg-black dark:bg-[#09090b] text-white rounded-t-[32px] sm:rounded-t-[38px] shadow-2xl"
                : "bg-transparent text-zinc-900 dark:text-white rounded-t-none"
            }`}
          >
            {/* Product Title & Price */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3
                  className={`font-black text-sm sm:text-base tracking-tight uppercase line-clamp-1 transition-colors duration-300 ${
                    isHovered ? "text-white" : "text-zinc-900 dark:text-white"
                  }`}
                >
                  {product.name}
                </h3>
                <div className="text-right flex-shrink-0">
                  <span
                    className={`font-black text-sm sm:text-base transition-colors duration-300 ${
                      isHovered ? "text-amber-400" : "text-amber-600 dark:text-[#D4B886]"
                    }`}
                  >
                    {formatPrice(displayPrice)}
                  </span>
                  {hasDiscount && (
                    <p className="text-[10px] text-zinc-400 line-through font-semibold leading-none">
                      {formatPrice(product.price)}
                    </p>
                  )}
                </div>
              </div>

              {/* Subtitle / Short Description */}
              <p
                className={`text-[11px] sm:text-xs line-clamp-2 leading-relaxed transition-colors duration-300 ${
                  isHovered ? "text-zinc-400" : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {product.description || product.subtitle || "Premium Oversized Heavyweight Cotton"}
              </p>

              {/* Specifications Pills */}
              <div className="flex items-center gap-2.5 text-[10px] text-zinc-400 pt-2 pb-1">
                <span className="flex items-center gap-1">
                  <Shirt size={11} className="opacity-70" />
                  {product.material || "100% قطن"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Layers size={11} className="opacity-70" />
                  {product.weight || "240 GSM"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users size={11} className="opacity-70" />
                  {product.fit || "Oversized"}
                </span>
              </div>

              {/* Color Variants Swatches */}
              {product.variants && product.variants.length > 1 && (
                <div className="flex items-center gap-2 pt-1.5 pb-2">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider ${
                      isHovered ? "text-zinc-400" : "text-zinc-500"
                    }`}
                  >
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
                        className={`w-3.5 h-3.5 rounded-full transition-all border ${
                          isHovered
                            ? "border-zinc-600 hover:border-white"
                            : "border-zinc-300 dark:border-zinc-700"
                        } ${
                          selectedVariantIdx === vIdx
                            ? "ring-2 ring-amber-400 scale-125 z-10"
                            : "opacity-80 hover:opacity-100 hover:scale-110"
                        }`}
                        style={{ backgroundColor: variant.colorHex }}
                        title={variant.colorName}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Row */}
            <div className="pt-3 mt-1 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-2">
              {/* Wishlist Small Action */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product);
                }}
                className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center ${
                  isHovered
                    ? "bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800"
                    : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800"
                }`}
                title="المفضلة"
              >
                <Heart
                  size={15}
                  className={isFavorite ? "fill-red-500 text-red-500" : ""}
                />
              </button>

              {/* Add to Cart Button (transforms into sleek white pill on hover) */}
              <button
                type="button"
                onClick={handleQuickAddToCart}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 shadow-sm ${
                  isHovered
                    ? isAddedBriefly
                      ? "bg-emerald-500 text-white shadow-emerald-500/20"
                      : "bg-white text-black hover:bg-zinc-100 shadow-lg"
                    : isAddedBriefly
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-900 text-white dark:bg-zinc-800 hover:bg-black dark:hover:bg-zinc-700"
                }`}
              >
                {isAddedBriefly ? (
                  <>
                    <Check size={15} className="animate-bounce" />
                    تمت الإضافة!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={14} />
                    إضافة للسلة
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
