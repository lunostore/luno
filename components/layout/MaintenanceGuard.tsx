"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MessageCircle, Instagram, Sparkles, ShieldAlert, Key, Lock, X } from "lucide-react";
import { toast } from "sonner";
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
  const [isBypassed, setIsBypassed] = useState(false);

  // Secret PIN modal states
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState("");

  // Bypass maintenance mode for admin routes
  const isAdminRoute = pathname?.startsWith("/admin");

  useEffect(() => {
    // Check if user has previously entered the correct secret PIN
    if (typeof window !== "undefined") {
      const savedBypass = localStorage.getItem("luno_maintenance_bypass");
      if (savedBypass === "true") {
        setIsBypassed(true);
      }
    }
  }, []);

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

  // If loading or admin route or maintenance disabled or secret PIN entered -> show site
  if (loading || isAdminRoute || !settings?.maintenanceEnabled || isBypassed) {
    return (
      <>
        {isBypassed && settings?.maintenanceEnabled && !isAdminRoute && (
          <div className="fixed top-3 left-3 z-[99999] bg-amber-500 text-black px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-xl border border-amber-400 animate-pulse select-none">
            <Key size={12} />
            وضع المعاينة السري (تخطي الصيانة)
            <button
              onClick={() => {
                localStorage.removeItem("luno_maintenance_bypass");
                setIsBypassed(false);
                toast.info("تم العودة لوضع الصيانة");
              }}
              className="mr-1 underline font-bold text-[9px] hover:opacity-75"
            >
              [قفل]
            </button>
          </div>
        )}
        {children}
      </>
    );
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

        {/* Luxury Social Action Cards Grid */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-lg mx-auto">
          {/* WhatsApp */}
          <a
            href={`https://wa.me/${whatsappPhone.replace(/^0/, "20")}?text=${encodeURIComponent(
              "مرحباً، أستفسر عن موعد فتح الموقع والمنتجات الجديدة"
            )}`}
            target="_blank"
            rel="noreferrer"
            className="group relative flex items-center sm:flex-col justify-start sm:justify-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-emerald-500/25 hover:border-emerald-500/70 hover:bg-zinc-900 transition-all duration-300 shadow-xl hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] active:scale-95 text-right sm:text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform shrink-0">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors">الواتساب</p>
              <p className="text-[10px] text-zinc-400 font-medium">تواصل معنا مباشرة</p>
            </div>
          </a>

          {/* Instagram */}
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="group relative flex items-center sm:flex-col justify-start sm:justify-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-pink-500/25 hover:border-pink-500/70 hover:bg-zinc-900 transition-all duration-300 shadow-xl hover:shadow-[0_0_25px_rgba(236,72,153,0.25)] active:scale-95 text-right sm:text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform shrink-0">
                <Instagram size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-white group-hover:text-pink-400 transition-colors">الإنستجرام</p>
                <p className="text-[10px] text-zinc-400 font-medium">شاهد الكولكشن</p>
              </div>
            </a>
          )}

          {/* TikTok */}
          {tiktokUrl && (
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noreferrer"
              className="group relative flex items-center sm:flex-col justify-start sm:justify-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-cyan-500/25 hover:border-cyan-500/70 hover:bg-zinc-900 transition-all duration-300 shadow-xl hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] active:scale-95 text-right sm:text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-zinc-900 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform shrink-0">
                <TiktokIcon size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors">التيك توك</p>
                <p className="text-[10px] text-zinc-400 font-medium">تابع الفيديوهات</p>
              </div>
            </a>
          )}
        </div>
      </motion.div>

      {/* Secret Maintenance Bypass Trigger (Bottom-Left Corner) */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setPinModalOpen(true)}
          className="p-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-zinc-600 hover:text-amber-400 transition-all duration-300 opacity-25 hover:opacity-100 backdrop-blur-md shadow-lg group"
          title="Secret Admin Preview Access"
        >
          <Lock size={16} className="group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* PIN Unlock Modal */}
      <AnimatePresence>
        {pinModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl relative text-center"
            >
              <button
                onClick={() => {
                  setPinModalOpen(false);
                  setPinError("");
                }}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1"
              >
                <X size={18} />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <Key size={26} />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">دخول تجربة الموقع 🔑</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  أدخل كود المرور الخاص بلوحة الإدارة لتخطي الصيانة والتصفح بصفة أدمن.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const targetPin = (settings?.maintenancePin || "1234").trim();
                  if (enteredPin.trim() === targetPin) {
                    localStorage.setItem("luno_maintenance_bypass", "true");
                    setIsBypassed(true);
                    setPinModalOpen(false);
                    toast.success("تم الدخول للموقع بنجاح! 🚀");
                  } else {
                    setPinError("كود المرور غير صحيح — حاول مرة أخرى");
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <input
                    type="password"
                    autoFocus
                    placeholder="أدخل الكود"
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value);
                      setPinError("");
                    }}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-center font-mono font-bold text-lg text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors tracking-widest"
                  />
                  {pinError && (
                    <p className="text-red-400 text-xs font-bold mt-2 animate-bounce">
                      {pinError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  تأكيد ودخول الموقع
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
