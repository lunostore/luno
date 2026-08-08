"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NXTCleanIntroProps {
  onComplete: () => void;
}

export function NXTCleanIntro({ onComplete }: NXTCleanIntroProps) {
  const [show, setShow] = useState(true);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Total duration: faster ~2.0 seconds
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(() => {
        onCompleteRef.current();
      }, 400);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleSkip = () => {
    setShow(false);
    setTimeout(() => {
      onCompleteRef.current();
    }, 200);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="nxt-only-clean-intro"
          onClick={handleSkip}
          className="fixed inset-0 z-[99999] bg-black text-white flex items-center justify-center overflow-hidden select-none cursor-pointer"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            filter: "blur(8px)",
            transition: { duration: 0.4, ease: [0.77, 0, 0.175, 1] },
          }}
        >
          {/* Main Container */}
          <div className="relative flex items-center justify-center px-8 py-12 overflow-hidden">
            {/* Sliding Entry: Right to Left (Faster 0.7s) */}
            <motion.div
              initial={{ x: 160, opacity: 0, filter: "blur(12px)" }}
              animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative flex items-center justify-center"
            >
              {/* Main Typography: ONLY "LUNO" */}
              <h1 className="relative text-7xl sm:text-9xl md:text-[13rem] font-black tracking-[0.25em] text-white uppercase drop-shadow-[0_0_35px_rgba(255,255,255,0.6)] z-10 pl-[0.25em]">
                LUNO
              </h1>

              {/* Shimmer Light Beam Effect Moving across the word from Right to Left (Faster 1.4s) */}
              <motion.div
                className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-l from-transparent via-white to-transparent mix-blend-overlay opacity-90"
                initial={{ x: "120%" }}
                animate={{ x: "-120%" }}
                transition={{
                  duration: 1.4,
                  delay: 0.2,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0.3,
                }}
              />

              {/* Light Laser Line Passing Right to Left */}
              <motion.div
                className="absolute top-0 bottom-0 w-[4px] bg-white shadow-[0_0_25px_10px_rgba(255,255,255,0.9)] z-30"
                initial={{ x: 250, opacity: 0 }}
                animate={{
                  x: [-250, 250],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 1.2,
                  delay: 0.25,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>

          {/* Minimal Bottom Line Accent */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-900">
            <motion.div
              className="h-full bg-white shadow-[0_0_12px_white]"
              initial={{ scaleX: 0, originX: 1 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2.0, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
