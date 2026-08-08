"use client";

import { motion } from "framer-motion";

interface Logo3DProps {
  className?: string;
  layers?: number;
  size?: number;
}

export function Logo3D({ className }: Logo3DProps) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <span className="font-black text-2xl sm:text-3xl tracking-[0.45em] uppercase text-zinc-950 dark:text-white pl-[0.45em]">
        L U N O
      </span>
    </div>
  );
}
