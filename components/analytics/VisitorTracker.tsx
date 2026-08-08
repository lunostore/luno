"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackVisitorSession } from "@/lib/firebase/firestore";
import * as gtag from "@/lib/analytics/gtag";

function getOrGenerateId(key: string, prefix: string, storage: Storage): string {
  try {
    let id = storage.getItem(key);
    if (!id) {
      id = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      storage.setItem(key, id);
    }
    return id;
  } catch {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

function detectDevice(): "Mobile" | "Desktop" | "Tablet" {
  if (typeof window === "undefined" || !navigator) return "Desktop";
  const ua = navigator.userAgent || "";
  const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  const width = typeof window !== "undefined" ? (window.innerWidth || document.documentElement.clientWidth || 0) : 0;

  // 1. Tablet check
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "Tablet";
  }

  // 2. Mobile User Agent regex
  if (
    /Mobile|iPhone|iPod|Android|BlackBerry|IEMobile|Kindle|Silk|Opera Mini|MobileSafari|CriOS|FxiOS|webOS/i.test(
      ua
    )
  ) {
    return "Mobile";
  }

  // 3. Fallback for mobile phones with Desktop Mode enabled (Screen width <= 768 or touch)
  if (isTouch && width > 0 && width <= 768) {
    return "Mobile";
  }
  if (isTouch && width > 768 && width <= 1024) {
    return "Tablet";
  }

  return "Desktop";
}

function detectBrowser(): string {
  if (typeof window === "undefined" || !navigator) return "غير معروف";
  const ua = navigator.userAgent || "";
  const vendor = navigator.vendor || "";

  // 1. In-App Browsers (تطبيقات التواصل الاجتماعي)
  if (ua.includes("Instagram")) return "Instagram";
  if (ua.includes("TikTok") || ua.includes("ByteLocale")) return "TikTok";
  if (ua.includes("FBAN") || ua.includes("FBAV")) return "Facebook";
  if (ua.includes("Snapchat")) return "Snapchat";
  if (ua.includes("Telegram")) return "Telegram";
  if (ua.includes("WhatsApp")) return "WhatsApp";
  if (ua.includes("Line/")) return "Line";
  if (ua.includes("Twitter")) return "Twitter / X";

  // 2. Specialized & Brand Mobile/Desktop Browsers
  if ((navigator as any).brave !== undefined || ua.includes("Brave")) return "Brave";
  if (ua.includes("SamsungBrowser")) return "Samsung Internet";
  if (ua.includes("UCBrowser") || ua.includes("UCWEB")) return "UC Browser";
  if (ua.includes("YaBrowser")) return "Yandex Browser";
  if (ua.includes("Vivaldi")) return "Vivaldi";
  if (ua.includes("Arc/")) return "Arc Browser";
  if (ua.includes("DuckDuckGo") || ua.includes("ddg_android")) return "DuckDuckGo";
  if (ua.includes("MiuiBrowser")) return "Xiaomi Miui";
  if (ua.includes("HuaweiBrowser") || ua.includes("HB/")) return "Huawei Browser";
  if (ua.includes("VivoBrowser")) return "Vivo Browser";
  if (ua.includes("HeyTapBrowser") || ua.includes("OppoBrowser")) return "OPPO Browser";
  if (ua.includes("Kiwi")) return "Kiwi Browser";
  if (ua.includes("Puffin")) return "Puffin";
  if (ua.includes("Aloha")) return "Aloha Browser";
  if (ua.includes("Silk/")) return "Amazon Silk";
  if (ua.includes("TorBrowser") || ua.includes("Tor/")) return "Tor Browser";
  if (ua.includes("QQBrowser") || ua.includes("MQQBrowser")) return "QQ Browser";
  if (ua.includes("Baidu") || ua.includes("baidubrowser")) return "Baidu";
  if (ua.includes("Sogou") || ua.includes("SE/")) return "Sogou";
  if (ua.includes("Maxthon")) return "Maxthon";

  // 3. Alternative Desktop Browsers
  if (ua.includes("Waterfox")) return "Waterfox";
  if (ua.includes("PaleMoon")) return "Pale Moon";
  if (ua.includes("SeaMonkey")) return "SeaMonkey";

  // 4. Major Global Browsers
  if (ua.includes("Edg/") || ua.includes("EdgA/") || ua.includes("EdgiOS/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera") || ua.includes("OPT/") || ua.includes("OPiOS/")) return "Opera";
  if (ua.includes("Firefox/") || ua.includes("FxiOS/")) return "Firefox";
  if (ua.includes("CriOS/")) return "Chrome (iOS)";
  if (ua.includes("Chrome/") && vendor.includes("Google")) return "Chrome";
  if (ua.includes("Safari/") && (vendor.includes("Apple") || ua.includes("Version/"))) return "Safari";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Safari/")) return "Safari";

  return "متصفح آخر";
}

export function VisitorTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Avoid tracking inside admin panel pages
    if (pathname && pathname.startsWith("/admin")) return;
    if (typeof window === "undefined") return;

    const visitorId = getOrGenerateId("nxt_visitor_id", "v", localStorage);
    const sessionId = getOrGenerateId("nxt_session_id", "s", sessionStorage);
    const device = detectDevice();
    const browser = detectBrowser();

    const isNewPage = lastPathRef.current !== pathname;
    lastPathRef.current = pathname;

    const sendPing = (isNew: boolean = false) => {
      try {
        trackVisitorSession({
          sessionId,
          visitorId,
          currentPage: window.location.pathname || "/",
          device,
          browser,
          isNewPageView: isNew,
        });
        // Send GA4 Google Analytics Pageview
        if (isNew) {
          gtag.pageview(window.location.pathname || "/");
        }
      } catch (err) {
        console.error("Visitor tracking error:", err);
      }
    };

    // Track immediately on mount / route change
    sendPing(isNewPage);

    // Track on visibility change (crucial for Mobile phones when user opens/resumes tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendPing(false);
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    // Send periodic heartbeat every 20s to keep session active
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        sendPing(false);
      }
    }, 20000);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [pathname]);

  return null;
}
