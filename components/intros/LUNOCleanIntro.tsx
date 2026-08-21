"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LUNOCleanIntroProps {
  onComplete: () => void;
}

export function LUNOCleanIntro({ onComplete }: LUNOCleanIntroProps) {
  const [show, setShow] = useState(true);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // 1.7 seconds display duration then initiate curtain slide up
    const timer = setTimeout(() => {
      setShow(false);
    }, 1700);

    return () => clearTimeout(timer);
  }, []);

  const handleSkip = () => {
    setShow(false);
  };

  return (
    <AnimatePresence onExitComplete={() => onCompleteRef.current()}>
      {show && (
        <motion.div
          key="luno-minimal-light-intro"
          onClick={handleSkip}
          className="fixed inset-0 z-[99999] bg-black text-white flex items-center justify-center overflow-hidden select-none cursor-pointer"
          initial={{ y: 0, opacity: 1 }}
          exit={{
            y: "-100%",
            transition: {
              duration: 0.85,
              ease: [0.76, 0, 0.24, 1], // Cinematic luxury ease curve
            },
          }}
        >
          {/* Main Typography & Light Beam Container with subtle parallax exit */}
          <motion.div
            exit={{
              y: -50,
              opacity: 0.8,
              transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] },
            }}
            className="relative flex flex-col items-center justify-center px-8 py-12 overflow-hidden"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative flex flex-col items-center justify-center"
            >
              {/* Main Brand Text: "LUNO" */}
              <h1 className="relative text-7xl sm:text-9xl md:text-[13rem] font-[950] tracking-[0.25em] text-white uppercase drop-shadow-[0_0_40px_rgba(255,255,255,0.7)] z-10 pl-[0.25em]">
                LUNO
              </h1>

              {/* Light Beam / Shimmer Effect Passing across the text */}
              <motion.div
                className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-r from-transparent via-white/90 to-transparent mix-blend-overlay"
                initial={{ x: "-120%" }}
                animate={{ x: "120%" }}
                transition={{
                  duration: 1.2,
                  delay: 0.15,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0.4,
                }}
              />

              {/* Glowing Laser Light Bar Line Passing Left to Right */}
              <motion.div
                className="absolute top-0 bottom-0 w-[6px] bg-white shadow-[0_0_30px_12px_rgba(255,255,255,0.95)] z-30 pointer-events-none"
                initial={{ x: -280, opacity: 0 }}
                animate={{
                  x: [280, -280],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 1.1,
                  delay: 0.2,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </motion.div>

          {/* Minimalist Accent Bottom Progress Line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-900">
            <motion.div
              className="h-full bg-white shadow-[0_0_12px_white]"
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.7, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

