"use client";

import { useState, useEffect } from "react";

export function useScroll(threshold = 60, resetThreshold = 15) {
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          setScrollY(currentY);

          // Hysteresis dead-zone: only turn true above threshold, only turn false below resetThreshold
          setScrolled((prev) => {
            if (currentY > threshold) return true;
            if (currentY < resetThreshold) return false;
            return prev;
          });

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold, resetThreshold]);

  return { scrolled, scrollY };
}

