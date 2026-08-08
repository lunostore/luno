"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Instagram, Facebook, MessageCircle } from "lucide-react";
import { getSiteSettings, type SiteSettings } from "@/lib/firebase/firestore";

function TiktokIcon({ size = 20 }: { size?: number }) {
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

export function Footer() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSiteSettings()
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch(console.error);
  }, []);

  // Hide footer on dedicated product details page
  if (pathname?.startsWith("/products/")) {
    return null;
  }

  const socialLinks = [
    {
      icon: Instagram,
      label: "Instagram",
      href: settings?.instagramUrl || "https://www.instagram.com/lunos.store1?igsh=ajZvanBuYW0yMGtp",
      bgClass: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/50 ring-2 ring-rose-500/30",
    },
    {
      icon: TiktokIcon,
      label: "TikTok",
      href: settings?.tiktokUrl || "https://www.tiktok.com/@lunostore4?_r=1&_t=ZS-98ilUuI7eZG",
      bgClass: "bg-black border border-cyan-400/60 text-white shadow-lg shadow-cyan-500/30 hover:shadow-pink-500/60 ring-2 ring-cyan-400/30",
    },
  ];

  return (
    <footer className="bg-zinc-100 dark:bg-black text-zinc-900 dark:text-white border-t border-zinc-200 dark:border-zinc-900 transition-colors duration-300 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Luno Store Brand Logo"
              className="h-8 w-auto object-contain dark:invert"
            />
            <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed max-w-sm">
              {settings?.footerDescription ||
                "Premium fashion for modern people. Elevate your style with our curated collections of high-quality clothing and accessories."}
            </p>
            <div className="flex gap-4 mt-6">
              {socialLinks.map(({ icon: Icon, label, href, bgClass }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  whileHover={{ scale: 1.15, rotate: [0, -6, 6, 0] }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 relative group ${bgClass}`}
                >
                  <Icon size={20} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-bold text-sm tracking-widest uppercase mb-4 text-zinc-950 dark:text-white">
              Shop
            </h4>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              {[
                { href: "/#products", label: "Our Collection" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-zinc-950 dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-bold text-sm tracking-widest uppercase mb-4 text-zinc-950 dark:text-white">
              Info
            </h4>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              {[
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact Us" },
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms of Service" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-zinc-950 dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="mt-12 pt-6 border-t border-zinc-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-end gap-4 text-xs text-zinc-500 dark:text-zinc-400">

          {/* Developer Credit & Website Link */}
          <div className="flex flex-col md:items-end items-center gap-1">
            <a
              href="https://nextgen-devs.online"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-zinc-900 dark:text-zinc-200 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
            >
              Developed by <span className="underline decoration-amber-500/50 underline-offset-4">NextGen Devs</span>
            </a>
            <a
              href="https://nextgen-devs.online"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-mono transition-colors"
            >
              <span>nextgen-devs.online</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
