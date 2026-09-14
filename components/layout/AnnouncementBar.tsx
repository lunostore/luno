"use client";

import { useSiteSettings } from "@/features/settings/SiteSettingsProvider";

export function AnnouncementBar() {
  const { settings } = useSiteSettings();

  const enabled = settings?.announcementEnabled ?? false;
  const text = settings?.announcementText?.trim() || "";

  if (!enabled || !text) return null;

  // نكرر النص 6 مرات لضمان حركة مستمرة بدون فراغات
  const repeatedText = Array(6).fill(text).join("     •     ");

  return (
    <div className="w-full bg-black dark:bg-white overflow-hidden select-none h-8 sm:h-9 flex items-center relative z-50">
      <div className="announcement-marquee whitespace-nowrap">
        <span className="inline-block text-[11px] sm:text-xs font-bold tracking-wide text-white dark:text-black px-4">
          {repeatedText}
        </span>
        <span className="inline-block text-[11px] sm:text-xs font-bold tracking-wide text-white dark:text-black px-4">
          {repeatedText}
        </span>
      </div>

      <style jsx>{`
        .announcement-marquee {
          display: flex;
          animation: marquee-scroll 35s linear infinite;
        }
        @keyframes marquee-scroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
