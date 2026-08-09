"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShoppingBag, Sparkles } from "lucide-react";
import { useTheme } from "@/features/theme/ThemeProvider";
import { getSiteSettings, type SiteSettings } from "@/lib/firebase/firestore";

export function HeroSection() {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    getSiteSettings()
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch(console.error);
  }, []);

  const isDark = theme === "dark";
  const mediaType = settings?.heroMediaType || "image";

  const videoUrl = isDark
    ? settings?.heroVideoUrlDark || settings?.heroVideoUrlLight
    : settings?.heroVideoUrlLight || settings?.heroVideoUrlDark;

  const imageList = useMemo(() => {
    const list = isDark
      ? settings?.heroImagesDark
      : settings?.heroImagesLight;
    return list?.filter((img) => img && !img.includes("banner")) || [];
  }, [isDark, settings?.heroImagesDark, settings?.heroImagesLight]);

  useEffect(() => {
    if (mediaType === "image" && imageList.length > 1) {
      const interval = setInterval(() => {
        setActiveImageIndex((prev) => (prev + 1) % imageList.length);
      }, 4500);
      return () => clearInterval(interval);
    }
  }, [mediaType, imageList.length]);

  const hasMedia = (mediaType === "video" && !!videoUrl) || (mediaType === "image" && imageList.length > 0);
  const currentImage = imageList[activeImageIndex % imageList.length];

  const handleScroll = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("products");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-[90vh] md:min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-black text-zinc-900 dark:text-white transition-colors duration-500 overflow-hidden pt-20">
      {/* Background Media Container (If configured in Admin CMS) */}
      {hasMedia && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-black transition-colors duration-500">
          {mediaType === "video" && videoUrl ? (
            <video
              key={videoUrl}
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-center rounded-none scale-100"
            />
          ) : currentImage ? (
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImage}
                src={currentImage}
                alt="Luno Store Hero — Premium Fashion"
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.8 }}
                transition={{ duration: 0.8 }}
                className="w-full h-full object-cover object-center rounded-none scale-100"
              />
            </AnimatePresence>
          ) : null}

          {/* Full-bleed gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/80 dark:from-black/40 dark:via-transparent dark:to-black/70 pointer-events-none" />
        </div>
      )}

      {/* Subtle Background Radial Mesh for Clean White Theme */}
      {!hasMedia && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-zinc-100 via-gray-100 to-zinc-200/50 dark:from-zinc-900/40 dark:to-zinc-900/10 blur-[130px] opacity-70" />
        </div>
      )}

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center py-12">
        {/* Top Luxury Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm"
        >
          <Sparkles size={14} className="text-amber-500" />
          <span>LUNO STORE • NEW ERA</span>
        </motion.div>

        {/* Hero Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase text-zinc-950 dark:text-white drop-shadow-sm leading-none"
        >
          LUNO STORE
        </motion.h1>

        {/* Hero Tagline Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-6 text-sm sm:text-base md:text-lg font-medium tracking-[0.3em] uppercase text-zinc-600 dark:text-zinc-400 max-w-2xl"
        >
          {settings?.heroTagline || "LUNO IS YOURS • MODERN STREETWEAR & LUXURY FASHION"}
        </motion.p>

        {/* 21st.dev Metallic Dark Gold Halo Shimmer SHOP NOW Button */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative group mt-10"
        >
          {/* Ambient Warm Golden Halo Glow Flare (Behind Button) */}
          <div className="absolute -inset-2 bg-gradient-to-r from-amber-600/30 via-yellow-500/50 to-amber-600/30 rounded-full blur-xl opacity-60 group-hover:opacity-100 group-hover:blur-2xl transition-all duration-500 pointer-events-none" />

          {/* Secondary Outer Gold Ring Flare */}
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-500/40 via-amber-300/60 to-amber-500/40 opacity-70 group-hover:opacity-100 blur-[2px] transition-all duration-300 pointer-events-none" />

          {/* Main Metallic Dark Pill Button */}
          <motion.button
            onClick={handleScroll}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="relative inline-flex items-center gap-3.5 px-9 py-4 rounded-full font-black text-sm sm:text-base tracking-widest uppercase text-white bg-gradient-to-r from-[#0a0a0a] via-[#1a1a1c] to-[#3a3a3d] border border-white/25 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(217,178,112,0.35)] overflow-hidden transition-all cursor-pointer select-none"
          >
            {/* Shimmer Light Ray Moving Across Button */}
            <motion.div
              className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-25deg] pointer-events-none"
              initial={{ x: "-150%" }}
              animate={{ x: "250%" }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 1 }}
            />

            {/* Shopping Bag Outline Icon */}
            <div className="relative z-10 p-1.5 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <ShoppingBag size={18} className="text-white group-hover:scale-110 transition-transform duration-300" />
            </div>
            
            {/* Button Label Text */}
            <span className="relative z-10 font-extrabold text-white drop-shadow-md">
              {settings?.heroButtonText || "SHOP NOW"}
            </span>

            {/* Arrow Right Icon */}
            <ArrowRight
              size={18}
              className="relative z-10 text-white group-hover:translate-x-2 transition-transform duration-300"
            />
          </motion.button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-400 dark:text-zinc-500 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <span className="text-[10px] font-extrabold tracking-[0.3em] uppercase text-zinc-500 dark:text-zinc-400">Scroll</span>
        <motion.div
          className="w-[2px] h-8 bg-gradient-to-b from-zinc-400 to-transparent dark:from-zinc-500 dark:to-transparent rounded-full"
          animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
