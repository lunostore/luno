"use client";

import { useEffect } from "react";
import { createSystemErrorLog } from "@/lib/firebase/firestore";

function isIgnorableError(message: string, stack: string = ""): boolean {
  const lowerMsg = (message || "").toLowerCase();
  const lowerStack = (stack || "").toLowerCase();

  // 1. Generic Cross-Origin Script Errors (Facebook / Instagram / TikTok in-app browser WebView injections)
  if (lowerMsg === "script error." || lowerMsg === "script error") {
    return true;
  }

  // 2. Firebase permissions
  if (
    lowerMsg.includes("permission-denied") ||
    lowerMsg.includes("insufficient permissions") ||
    lowerMsg.includes("missing or insufficient permissions")
  ) {
    return true;
  }

  // 3. Browser extensions
  if (
    lowerStack.includes("chrome-extension://") ||
    lowerStack.includes("moz-extension://") ||
    lowerStack.includes("safari-extension://")
  ) {
    return true;
  }

  // 4. Benign ResizeObserver layout warnings
  if (
    lowerMsg.includes("resizeobserver loop completed with undelivered notifications") ||
    lowerMsg.includes("resizeobserver loop limit exceeded")
  ) {
    return true;
  }

  return false;
}

export function ErrorTrackerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Print System Logger Initialized banner in Console
    console.log(
      "%c 🚀 Luno Store Error Logger Active & Reporting ",
      "background: #000; color: #00ffcc; font-weight: bold; font-size: 11px; padding: 4px 8px; border-radius: 6px;"
    );

    const handleGlobalError = (event: ErrorEvent) => {
      const msg = event.message || "";
      const stack = event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`;

      if (isIgnorableError(msg, stack)) {
        return;
      }

      // 1. Detailed Console Output for Developers & Debugging
      console.group(
        "%c ❌ [LUNO SYSTEM ERROR] ",
        "background: #dc2626; color: #ffffff; font-weight: bold; font-size: 11px; padding: 3px 6px; border-radius: 4px;"
      );
      console.error("Message:", msg);
      console.info("Location:", window.location.href);
      if (stack) console.error("Stack:", stack);
      console.groupEnd();

      // 2. Save to Firestore Error Logs
      createSystemErrorLog({
        message: msg || "Global Unhandled Error",
        stack,
        url: window.location.href,
        context: "Global Unhandled Error",
      }).catch(() => {});
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        typeof reason === "string"
          ? reason
          : reason?.message || "Unhandled Promise Rejection";

      const stack = reason?.stack || "";

      if (isIgnorableError(message, stack)) {
        return;
      }

      // 1. Detailed Console Output for Promise Rejections
      console.group(
        "%c ⚠️ [LUNO UNHANDLED REJECTION] ",
        "background: #f59e0b; color: #000000; font-weight: bold; font-size: 11px; padding: 3px 6px; border-radius: 4px;"
      );
      console.error("Reason:", message);
      console.info("Location:", window.location.href);
      if (stack) console.error("Stack:", stack);
      console.groupEnd();

      // 2. Save to Firestore Error Logs
      createSystemErrorLog({
        message,
        stack,
        url: window.location.href,
        context: "Unhandled Promise Rejection",
      }).catch(() => {});
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
}
