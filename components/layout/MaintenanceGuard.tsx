"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MessageCircle, Instagram, Sparkles, ShieldAlert, ArrowLeft } from "lucide-react";
import { useSiteSettings } from "@/features/settings/SiteSettingsProvider";
import { updateSiteSettings } from "@/lib/firebase/firestore";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function TiktokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { settings, loading } = useSiteSettings();
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  // Bypass maintenance mode for admin routes
  const isAdminRoute = pathname?.startsWith("/admin");

  useEffect(() => {
    if (!settings?.maintenanceEnabled || !settings?.maintenanceEndTime) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = (): TimeLeft => {
      const target = new Date(settings.maintenanceEndTime!).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isExpired: false,
      };
    };

    // Calculate initial
    const initial = calculateTimeLeft();
    setTimeLeft(initial);

    if (initial.isExpired) {
      // Auto disable maintenance mode in database when time is up
      updateSiteSettings({ maintenanceEnabled: false }).catch(console.error);
      return;
    }

    const timer = setInterval(() => {
      const updated = calculateTimeLeft();
      setTimeLeft(updated);
      if (updated.isExpired) {
        clearInterval(timer);
        updateSiteSettings({ maintenanceEnabled: false }).catch(console.error);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [settings?.maintenanceEnabled, settings?.maintenanceEndTime]);

  // If loading or admin route or maintenance disabled -> show app
  if (loading || isAdminRoute || !settings?.maintenanceEnabled) {
    return <>{children}</>;
  }

  // If timer was set and expired -> show app
  if (timeLeft && timeLeft.isExpired) {
    return <>{children}</>;
  }

  const whatsappPhone = settings?.storePhone || "01107108679";
  const instagramUrl = settings?.instagramUrl || "https://www.instagram.com/lunos.store1";
  const tiktokUrl = settings?.tiktokUrl || "https://www.tiktok.com/@lunostore4";
  const storeName = settings?.storeName || "LUNO STORE";

  return (
    <div
      className="fixed inset-0 z-[9999] bg-zinc-950 text-white flex flex-col items-center justify-center p-6 overflow-hidden select-none"
      dir="rtl"
    >
      {/* Background glow animations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        className="relative z-10 max-w-xl w-full text-center space-y-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Logo / Brand Header */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center p-3 shadow-2xl shadow-emerald-500/10 relative">
            <span className="font-black text-sm tracking-widest text-white uppercase">LUNO</span>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase">
            <Sparkles size={13} />
            وضع الصيانة والتحديثات
          </span>
        </div>


        {/* Title & Description */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            {settings?.maintenanceTitle || "الموقع قيد الصيانة والتحديث 🚀"}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
            {settings?.maintenanceReason ||
              "نقوم الآن بتحديث المخزون وتنزيل التشكيلة الجديدة لنقدم لكم أفضل تجربة تسوق. سنعود قريباً جداً!"}
          </p>
        </div>

        {/* Live Countdown Timer */}
        {timeLeft && !timeLeft.isExpired && (
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center justify-center gap-1.5">
              <Clock size={13} className="text-emerald-400 animate-pulse" />
              الوقت المتبقي حتى الافتتاح
            </p>

            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
              {[
                { label: "أيام", value: timeLeft.days },
                { label: "ساعات", value: timeLeft.hours },
                { label: "دقائق", value: timeLeft.minutes },
                { label: "ثوانٍ", value: timeLeft.seconds },
              ].map((unit, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900/90 border border-zinc-800/90 backdrop-blur-md rounded-2xl p-3 sm:p-4 text-center shadow-lg"
                >
                  <span className="block font-mono text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                    {String(unit.value).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-zinc-500 mt-1 block">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Contact & Social Links */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={`https://wa.me/${whatsappPhone.replace(/^0/, "20")}?text=${encodeURIComponent(
              "مرحباً، أستفسر عن موعد فتح الموقع والمنتجات الجديدة"
            )}`}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <MessageCircle size={16} />
            تواصل معنا على الواتساب
          </a>
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <Instagram size={16} />
              تابعنا على الإنستجرام
            </a>
          )}
          {tiktokUrl && (
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <TiktokIcon size={16} />
              تابعنا على التيك توك
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
}
