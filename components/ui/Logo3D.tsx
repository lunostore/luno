"use client";

import { motion } from "framer-motion";

interface Logo3DProps {
  className?: string;
  layers?: number;
  size?: number;
}

export function Logo3D({ className = "", layers = 18, size = 160 }: Logo3DProps) {
  const halfLayers = Math.floor(layers / 2);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: Math.round(size * 0.45),
        perspective: "1000px",
      }}
    >
      <motion.div
        className="w-full h-full relative flex items-center justify-center pointer-events-none"
        style={{
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
        animate={{
          rotateY: [0, 360],
          rotateX: [8, 8],
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: "linear",
        }}
      >
        {/* Front 3D Extrusion Stack */}
        {Array.from({ length: halfLayers }).map((_, i) => {
          const isFront = i === 0;
          const zOffset = (halfLayers - i) * 0.75;

          return (
            <div
              key={`front-${i}`}
              className="absolute inset-0 w-full h-full flex items-center justify-center"
              style={{
                transform: `translateZ(${zOffset}px)`,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                filter: isFront
                  ? "drop-shadow(0 6px 16px rgba(0,0,0,0.35))"
                  : `brightness(${Math.max(0.35, 1 - (i / halfLayers) * 0.55)})`,
              }}
            >
              <span className="font-[950] text-3xl sm:text-4xl md:text-5xl tracking-[0.2em] uppercase text-zinc-950 dark:text-white whitespace-nowrap pl-2 [-webkit-text-stroke:1px_currentColor]">
                LUNO
              </span>
            </div>
          );
        })}

        {/* Back 3D Extrusion Stack (Flipped 180° so text is 100% readable when rotated) */}
        {Array.from({ length: halfLayers }).map((_, i) => {
          const isBackFace = i === 0;
          const zOffset = -(halfLayers - i) * 0.75;

          return (
            <div
              key={`back-${i}`}
              className="absolute inset-0 w-full h-full flex items-center justify-center"
              style={{
                transform: `translateZ(${zOffset}px) rotateY(180deg)`,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                filter: isBackFace
                  ? "drop-shadow(0 6px 16px rgba(0,0,0,0.35))"
                  : `brightness(${Math.max(0.35, 1 - (i / halfLayers) * 0.55)})`,
              }}
            >
              <span className="font-[950] text-3xl sm:text-4xl md:text-5xl tracking-[0.2em] uppercase text-zinc-950 dark:text-white whitespace-nowrap pl-2 [-webkit-text-stroke:1px_currentColor]">
                LUNO
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
