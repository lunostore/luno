"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackVisitorSession, type FunnelStage } from "@/lib/firebase/firestore";
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
  if ("brave" in navigator || ua.includes("Brave")) return "Brave";
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

function computeCurrentStage(pathname: string, search: string): {
  stage: FunnelStage;
  label: string;
  rank: number;
  productId?: string;
} {
  const p = (pathname || "/").toLowerCase();
  const searchLower = (search || "").toLowerCase();
  const params = new URLSearchParams(search || "");
  const pId = params.get("id") || params.get("slug") || "";

  if (p.includes("/order-success")) {
    return { stage: "order_success", label: "أتم الشراء بنجاح ✅", rank: 5 };
  }
  if (p.includes("/checkout")) {
    return { stage: "checkout", label: "صفحة الدفع (Checkout 🛒💳)", rank: 4 };
  }
  if (p.includes("/cart")) {
    return { stage: "cart", label: "سلة المشتريات (Cart)", rank: 3 };
  }
  if (p.startsWith("/products") || pId || searchLower.includes("id=")) {
    return { stage: "product", label: "مشاهدة منتج", rank: 2, productId: pId || undefined };
  }
  return { stage: "browse", label: "تصفح عام", rank: 1 };
}

function extractAndStoreCampaign(search: string): {
  campaignName?: string;
  campaignSource?: string;
  campaignMedium?: string;
  campaignProductId?: string;
  isFromCampaign: boolean;
} {
  if (typeof window === "undefined") return { isFromCampaign: false };

  try {
    const params = new URLSearchParams(search || "");
    const urlCampaign = params.get("utm_campaign") || params.get("campaign");
    const urlSource = params.get("utm_source") || params.get("source");
    const urlMedium = params.get("utm_medium") || params.get("medium");
    const urlProdId = params.get("id") || params.get("slug") || "";

    // If new campaign in URL, store it in sessionStorage
    if (urlCampaign) {
      sessionStorage.setItem("nxt_campaign_name", urlCampaign);
      if (urlSource) sessionStorage.setItem("nxt_campaign_source", urlSource);
      if (urlMedium) sessionStorage.setItem("nxt_campaign_medium", urlMedium);
      if (urlProdId) sessionStorage.setItem("nxt_campaign_product_id", urlProdId);
      sessionStorage.setItem("nxt_is_campaign", "1");
    }

    const savedCampaign = sessionStorage.getItem("nxt_campaign_name") || undefined;
    const savedSource = sessionStorage.getItem("nxt_campaign_source") || undefined;
    const savedMedium = sessionStorage.getItem("nxt_campaign_medium") || undefined;
    const savedProdId = sessionStorage.getItem("nxt_campaign_product_id") || undefined;
    const savedProdName = sessionStorage.getItem("nxt_campaign_product_name") || undefined;
    const isCampaign = Boolean(savedCampaign || sessionStorage.getItem("nxt_is_campaign") === "1");

    return {
      campaignName: savedCampaign,
      campaignSource: savedSource,
      campaignMedium: savedMedium,
      campaignProductId: savedProdId,
      campaignProductName: savedProdName,
      isFromCampaign: isCampaign,
    };
  } catch {
    return { isFromCampaign: false };
  }
}

function getAndPersistMaxStage(
  current: { stage: FunnelStage; label: string; rank: number; productId?: string },
  currentPath: string
): {
  maxStage: FunnelStage;
  maxStageLabel: string;
  maxStagePath: string;
  maxStageRank: number;
  maxStageProductName?: string;
} {
  if (typeof window === "undefined") {
    return {
      maxStage: current.stage,
      maxStageLabel: current.label,
      maxStagePath: currentPath,
      maxStageRank: current.rank,
      maxStageProductName: current.productId,
    };
  }

  try {
    const storedRankStr = sessionStorage.getItem("nxt_max_stage_rank");
    const storedRank = storedRankStr ? parseInt(storedRankStr, 10) : 0;
    const storedProductName = sessionStorage.getItem("nxt_max_stage_product_name") || undefined;

    // Upgrade to higher stage (e.g. from browse to checkout, or checkout to order_success)
    if (current.rank >= storedRank) {
      sessionStorage.setItem("nxt_max_stage_rank", current.rank.toString());
      sessionStorage.setItem("nxt_max_stage", current.stage);
      sessionStorage.setItem("nxt_max_stage_label", current.label);
      sessionStorage.setItem("nxt_max_stage_path", currentPath);
      if (current.productId) {
        sessionStorage.setItem("nxt_max_stage_product_id", current.productId);
      }
      return {
        maxStage: current.stage,
        maxStageLabel: current.label,
        maxStagePath: currentPath,
        maxStageRank: current.rank,
        maxStageProductName: storedProductName || current.productId,
      };
    }

    // Stored rank is strictly higher (e.g. visitor reached /checkout and then returned to home /)
    // Keep the higher stage recorded!
    return {
      maxStage: (sessionStorage.getItem("nxt_max_stage") as FunnelStage) || current.stage,
      maxStageLabel: sessionStorage.getItem("nxt_max_stage_label") || current.label,
      maxStagePath: sessionStorage.getItem("nxt_max_stage_path") || currentPath,
      maxStageRank: storedRank,
      maxStageProductName: storedProductName || sessionStorage.getItem("nxt_max_stage_product_id") || undefined,
    };
  } catch {
    return {
      maxStage: current.stage,
      maxStageLabel: current.label,
      maxStagePath: currentPath,
      maxStageRank: current.rank,
      maxStageProductName: current.productId,
    };
  }
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

    const currentFullPath =
      window.location.pathname + (window.location.search || "");
    const isNewPage = lastPathRef.current !== currentFullPath;
    lastPathRef.current = currentFullPath;

    const sendPing = (isNew: boolean = false) => {
      try {
        const fullCurrentPath =
          window.location.pathname + (window.location.search || "");
        const currentSearch = window.location.search || "";

        // Extract campaign attribution
        const campaignData = extractAndStoreCampaign(currentSearch);

        // Compute current stage and max stage
        const stageInfo = computeCurrentStage(
          window.location.pathname || "/",
          currentSearch
        );
        const maxStageInfo = getAndPersistMaxStage(stageInfo, fullCurrentPath);

        trackVisitorSession({
          sessionId,
          visitorId,
          currentPage: fullCurrentPath || "/",
          device,
          browser,
          isNewPageView: isNew,

          maxStage: maxStageInfo.maxStage,
          maxStageLabel: maxStageInfo.maxStageLabel,
          maxStagePath: maxStageInfo.maxStagePath,
          maxStageRank: maxStageInfo.maxStageRank,
          maxStageProductName: maxStageInfo.maxStageProductName,

          campaignName: campaignData.campaignName,
          campaignSource: campaignData.campaignSource,
          campaignMedium: campaignData.campaignMedium,
          campaignProductId: campaignData.campaignProductId,
          isFromCampaign: campaignData.isFromCampaign,
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

    // Track on popstate / custom URL changes (e.g. product modal opening)
    const handleUrlChange = () => {
      sendPing(true);
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);
    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("nxt_url_changed", handleUrlChange);

    // Send periodic heartbeat every 20s to keep session active
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        sendPing(false);
      }
    }, 20000);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("nxt_url_changed", handleUrlChange);
      clearInterval(interval);
    };
  }, [pathname]);

  return null;
}
