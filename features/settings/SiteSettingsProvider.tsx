"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { subscribeSiteSettings, type SiteSettings } from "@/lib/firebase/firestore";

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: null,
  loading: true,
});

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to real-time updates from Firebase Firestore
    const unsubscribe = subscribeSiteSettings((newSettings) => {
      setSettings(newSettings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
