"use client";

import { motion } from "framer-motion";

interface Logo3DProps {
  className?: string;
  layers?: number;
  size?: number;
}

export function Logo3D({ className = "", layers = 16, size = 130 }: Logo3DProps) {
  const actualLayers = Math.min(layers, 18);

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
          rotateY: [-45, 45, -45],
          rotateX: [6, -6, 6],
        }}
        transition={{
          repeat: Infinity,
          duration: 5,
          ease: "easeInOut",
        }}
      >
        {Array.from({ length: actualLayers }).map((_, i) => {
          const isFront = i === 0;
          const zOffset = -i * 0.45;

          return (
            <div
              key={i}
              className="absolute inset-0 w-full h-full flex items-center justify-center"
              style={{
                transform: `translateZ(${zOffset}px)`,
                backfaceVisibility: "hidden",
                filter: isFront
                  ? "drop-shadow(0 4px 12px rgba(0,0,0,0.3))"
                  : `brightness(${Math.max(0.4, 1 - (i / actualLayers) * 0.6)})`,
                opacity: isFront ? 1 : 0.95,
              }}
            >
              <span className="font-black text-2xl sm:text-3xl md:text-4xl tracking-widest uppercase text-zinc-950 dark:text-white whitespace-nowrap pl-1">
                LUNO
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
