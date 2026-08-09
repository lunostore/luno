"use client";

import { useEffect } from "react";

export function saveScrollAndReferrer() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("luno_saved_scroll", window.scrollY.toString());
    sessionStorage.setItem("luno_referrer", window.location.pathname + window.location.search);
  }
}

export function restoreSavedScroll() {
  if (typeof window !== "undefined") {
    const savedScroll = sessionStorage.getItem("luno_saved_scroll");
    if (savedScroll) {
      const scrollY = parseInt(savedScroll, 10);
      if (!isNaN(scrollY) && scrollY > 0) {
        // Use double RAF / setTimeout for React layout completion
        requestAnimationFrame(() => {
          setTimeout(() => {
            window.scrollTo({ top: scrollY, behavior: "instant" });
            sessionStorage.removeItem("luno_saved_scroll");
          }, 80);
        });
      }
    }
  }
}

export function useScrollRestoration() {
  useEffect(() => {
    restoreSavedScroll();
  }, []);
}
