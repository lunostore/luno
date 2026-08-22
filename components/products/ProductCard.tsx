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
  const [isAdding, setIsAdding] = useState(false);
  const [isAddedBriefly, setIsAddedBriefly] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const svgPathRef = useRef<SVGPathElement>(null);

  const [svgPath, setSvgPath] = useState({
    defaultPath: "",
    hoverPath: "",
  });

  // Calculate exact SVG dome curve dimensions according to card width (matching Shopflex)
  const updateSvgPaths = () => {
    if (imageWrapperRef.current) {
      const width = imageWrapperRef.current.clientWidth || 300;
      setSvgPath({
        defaultPath: `M0 100 L0 200 L${width} 200 L${width} 100 Q${width / 2} 100 0 100`,
        hoverPath: `M0 100 L0 200 L${width} 200 L${width} 100 Q${width / 2} 0 0 100`,
      });
    }
  };

  useEffect(() => {
    updateSvgPaths();
    window.addEventListener("resize", updateSvgPaths);
    return () => window.removeEventListener("resize", updateSvgPaths);
  }, []);

  const primaryImage = product.mainImage || "/placeholder.jpg";
  const hoverImage = product.hoverImage || product.images?.[0] || primaryImage;
  const currentImage = isHovered ? hoverImage : primaryImage;

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: 0.6,
        delay: (index % 4) * 0.08,
        ease: [0.76, 0, 0.24, 1],
      }}
      className="w-full relative pt-6 select-none"
    >
      {/* ── EXACT SHOPFLEX CARD CONTAINER ── */}
      <div
        ref={cardRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => openProduct(product.id)}
        className="group relative w-full rounded-[25px] border border-[#cdcdcd] dark:border-zinc-800 hover:border-[#292929] dark:hover:border-zinc-400 transition-[border-color] duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] bg-white dark:bg-[#121214] cursor-pointer overflow-visible"
        data-cursor-size="80px"
        data-cursor-text="Ver"
      >
        {/* ── TOP IMAGE CONTAINER (SQUARE PB-100% WITH FLOATING POP-OUT & FLOOR SHADOW) ── */}
        <div
          ref={imageWrapperRef}
          className="relative w-full pb-[100%] flex justify-center overflow-visible"
        >
          <div
            className="absolute top-0 w-[calc(100%-45px)] h-full flex items-center justify-center pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-top-[20%] group-hover:scale-110"
            style={{
              transform: isHovered
                ? `translateY(${customOffsetY}px) scale(${1.1 * customScale})`
                : `translateY(${customOffsetY}px) scale(${1 * customScale})`,
            }}
          >
            {/* Ambient Floor Shadow under garment */}
            <div className="absolute right-[15%] bottom-[10%] w-[70%] h-[9%] bg-black dark:bg-white/40 rounded-[50%] filter blur-[24px] opacity-40 -z-10 transition-opacity duration-300" />

            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                ref={imgRef}
                src={currentImage}
                alt={product.name}
                fill
                priority={index < 4}
                quality={95}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-contain object-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)] pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)]"
              />
            </div>
          </div>
        </div>

        {/* ── BOTTOM CONTENT SECTION (WITH SLIDING CONVEX DOME ARCH & RISING BLACK SHELF) ── */}
        <div className="bottom-0 px-6 pb-6 pt-12 relative rounded-b-[25px] overflow-hidden z-10 mt-auto">
          {/* Animated Rising Black Background with Convex Dome Arc on Top */}
          <div
            className={`absolute inset-x-0 bottom-0 h-full pointer-events-none z-0 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
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
          <div className="flex justify-between items-baseline gap-2 relative z-10 pt-2">
            <p className="text-2xl text-black dark:text-white group-hover:text-white dark:group-hover:text-black font-semibold max-w-[70%] text-ellipsis whitespace-nowrap overflow-hidden transition-colors duration-300 delay-100">
              {product.name}
            </p>
            <span className="text-xl uppercase text-black dark:text-white group-hover:text-white dark:group-hover:text-black font-semibold whitespace-nowrap transition-colors duration-300 delay-100">
              {formatPrice(displayPrice)}
            </span>
          </div>

          {/* Description */}
          <span className="text-black dark:text-zinc-400 group-hover:text-white dark:group-hover:text-zinc-800 my-3 block text-sm line-clamp-2 leading-relaxed transition-colors duration-300 delay-100 relative z-10">
            {product.description || "High-density premium fabric with signature cut and tailored fit."}
          </span>

          {/* ── BUTTONS ROW (EXACT SHOPFLEX PRIMARY BUTTONS WITH BUBBLE HOVER) ── */}
          <div className="flex justify-between items-center gap-4 relative z-10">
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
              className="group/btn relative overflow-hidden flex items-center justify-center p-[10px] w-12 h-12 rounded-[15px] border border-[#292929] dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-900 transition-all duration-300 flex-shrink-0 cursor-pointer"
              title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            >
              {/* Normal Icon */}
              <p className="relative top-0 w-full text-center flex justify-center items-center text-[#292929] dark:text-zinc-200 transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:-top-10">
                <Heart
                  size={20}
                  className={`transition-colors ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                />
              </p>

              {/* Hover Expanding Bubble Overlay */}
              <div className="absolute top-[110%] left-0 w-full h-full flex items-center justify-center transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:top-0 pointer-events-none">
                <p className="absolute w-full flex justify-center items-center text-white dark:text-black text-center z-10">
                  <Heart
                    size={20}
                    className={`transition-colors ${
                      isFavorite ? "fill-red-500 text-red-500" : "fill-white text-white dark:fill-black dark:text-black"
                    }`}
                  />
                </p>
                <div className="bg-black dark:bg-white w-[60%] h-full rounded-[50%] transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:w-full group-hover/btn:rounded-[15px]" />
              </div>
            </button>

            {/* Add to Cart Button */}
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleAddToCart}
              data-cursor-size="0px"
              className="group/btn relative overflow-hidden flex-1 h-12 rounded-[15px] border border-[#292929] dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-900 transition-all duration-300 flex items-center justify-center cursor-pointer"
            >
              {/* Normal Text Content */}
              <p className="relative top-0 w-full text-center flex justify-center items-center text-[#292929] dark:text-zinc-200 transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:-top-10 font-medium text-sm">
                {isAddedBriefly ? (
                  <span className="flex items-center gap-2">
                    <Check size={18} className="text-emerald-600 animate-bounce" />
                    <span>تمت الإضافة!</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>Add to cart</span>
                    <ShoppingCart size={18} />
                  </span>
                )}
              </p>

              {/* Hover Expanding Bubble Overlay */}
              <div className="absolute top-[110%] left-0 w-full h-full flex items-center justify-center transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:top-0 pointer-events-none">
                <p className="absolute w-full flex justify-center items-center text-white dark:text-black text-center z-10 font-medium text-sm">
                  {isAddedBriefly ? (
                    <span className="flex items-center gap-2">
                      <Check size={18} className="text-emerald-400 animate-bounce" />
                      <span>تمت الإضافة!</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Add to cart</span>
                      <ShoppingCart size={18} />
                    </span>
                  )}
                </p>
                <div className="bg-black dark:bg-white w-[60%] h-full rounded-[50%] transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover/btn:w-full group-hover/btn:rounded-[15px]" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

