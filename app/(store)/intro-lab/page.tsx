"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LUNOCleanIntro } from "@/components/intros/LUNOCleanIntro";

export default function IntroLabPage() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-sans">
      {playing && (
        <LUNOCleanIntro
          onComplete={() => setPlaying(false)}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center space-y-6 max-w-sm border border-zinc-800 bg-zinc-950 p-8 rounded-3xl shadow-2xl"
      >
        <div className="flex flex-col items-center justify-center gap-2 mb-2">
          <span className="text-5xl font-black tracking-[0.25em] text-white">LUNO</span>
        </div>

        <p className="text-zinc-400 text-xs leading-relaxed">
          معاينة انترو كلمة LUNO فقط باللون الأبيض الفاخر، مع لمعة ضوئية تحرك من اليمين إلى اليسار وخلفية سوداء.
        </p>

        <button
          onClick={() => setPlaying(true)}
          className="inline-flex items-center justify-center gap-2 bg-white text-black font-extrabold text-sm px-8 py-3.5 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer w-full"
        >
          <Play size={16} fill="black" />
          معاينة انترو LUNO الآن
        </button>

        <div className="flex items-center justify-center pt-2 border-t border-zinc-800">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs transition-colors"
          >
            <ArrowLeft size={13} />
            العودة للمتجر الرئيسي
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
