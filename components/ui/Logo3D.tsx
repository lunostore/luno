"use client";

import { motion } from "framer-motion";

interface Logo3DProps {
  className?: string;
  layers?: number;
  size?: number;
}

export function Logo3D({ className = "", layers = 14, size = 130 }: Logo3DProps) {
  const actualLayers = Math.min(layers, 16);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: Math.round(size * 0.35),
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
          rotateX: [10, 10],
        }}
        transition={{
          repeat: Infinity,
          duration: 9,
          ease: "linear",
        }}
      >
        {Array.from({ length: actualLayers }).map((_, i) => {
          const isFront = i === 0;
          const zOffset = -i * 0.6;

          return (
            <div
              key={i}
              className="absolute inset-0 w-full h-full flex items-center justify-center"
              style={{
                transform: `translateZ(${zOffset}px)`,
                backfaceVisibility: "visible",
                filter: isFront
                  ? "drop-shadow(0 4px 10px rgba(0,0,0,0.25))"
                  : `brightness(${Math.max(0.35, 1 - (i / actualLayers) * 0.65)})`,
                opacity: isFront ? 1 : 0.9,
              }}
            >
              <span className="font-black text-xl sm:text-2xl md:text-3xl tracking-[0.45em] uppercase text-zinc-950 dark:text-white whitespace-nowrap pl-[0.45em]">
                L U N O
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
