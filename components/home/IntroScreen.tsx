"use client";

import { useState, useEffect } from "react";
import { LUNOIntro } from "@/components/intros/LUNOIntro";

// In-memory session flag: persists during SPA route navigation, resets on browser page reload (F5)
let sessionIntroPlayed = false;

export function IntroScreen({ onComplete }: { onComplete?: () => void }) {
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window !== "undefined") {
      // Check if already played in this JS session
      if (sessionIntroPlayed) {
        return false;
      }
    }
    return true;
  });

  useEffect(() => {
    // Listen for manual trigger event (e.g. from settings or intro lab)
    const handleManualTrigger = () => {
      setShowIntro(true);
    };

    window.addEventListener("luno_trigger_intro", handleManualTrigger);
    window.addEventListener("nxt_trigger_intro", handleManualTrigger);
    return () => {
      window.removeEventListener("luno_trigger_intro", handleManualTrigger);
      window.removeEventListener("nxt_trigger_intro", handleManualTrigger);
    };
  }, []);

  const handleComplete = () => {
    sessionIntroPlayed = true;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("luno_intro_played", "true");
    }
    setShowIntro(false);
    if (onComplete) {
      onComplete();
    }
  };

  if (!showIntro) return null;

  return <LUNOIntro onComplete={handleComplete} />;
}

