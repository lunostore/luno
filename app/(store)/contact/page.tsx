"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Instagram, Send } from "lucide-react";
import { toast } from "sonner";
import { createContactMessage } from "@/lib/firebase/firestore";
import { useSiteSettings } from "@/features/settings/SiteSettingsProvider";
import { Spinner } from "@/components/ui/Spinner";

export default function ContactPage() {
  const { settings } = useSiteSettings();

  const [name, setName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const storeEmail = settings?.storeEmail || "lunoegypt@gmail.com";
  const storePhone = settings?.storePhone || "01107108679";
  const instagramUrl =
    settings?.instagramUrl ||
    "https://www.instagram.com/lunos.store1?igsh=ajZvanBuYW0yMGtp";
  const tiktokUrl =
    settings?.tiktokUrl ||
    "https://www.tiktok.com/@lunostore4?_r=1&_t=ZS-98ilUuI7eZG";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!emailInput.trim() || !emailInput.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!message.trim()) {
      toast.error("Please write your message");
      return;
    }

    setSubmitting(true);
    try {
      await createContactMessage({
        name: name.trim(),
        email: emailInput.trim(),
        message: message.trim(),
      });
      toast.success("Your message has been received! Our team will respond shortly.");
      setName("");
      setEmailInput("");
      setMessage("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-white dark:bg-black text-foreground">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">
            Get in Touch
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Contact Us
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg">
            We&apos;re here to help. Reach out anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {[
              {
                icon: Mail,
                label: "Email",
                value: storeEmail,
                href: `mailto:${storeEmail}`,
                colorStyle: "bg-gray-100 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-foreground",
              },
              {
                icon: Phone,
                label: "Phone / WhatsApp (For order 📥)",
                value: storePhone,
                href: `https://wa.me/201107108679`,
                colorStyle: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400",
              },
              {
                icon: Instagram,
                label: "Instagram",
                value: "@lunos.store1",
                href: instagramUrl,
                colorStyle: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md shadow-rose-500/30 border-none",
                animate: true,
              },
              {
                icon: function TiktokSvg({ size = 20 }: { size?: number }) {
                  return (
                    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                    </svg>
                  );
                },
                label: "TikTok",
                value: "@lunostore4",
                href: tiktokUrl,
                colorStyle: "bg-black border border-cyan-400/80 text-white shadow-md shadow-cyan-500/30",
                animate: true,
              },
              {
                icon: MapPin,
                label: "Location",
                value: "Benha, Egypt",
                href: null,
                colorStyle: "bg-gray-100 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-foreground",
              },
            ].map(({ icon: Icon, label, value, href, colorStyle, animate }) => (
              <motion.div
                key={label}
                whileHover={animate ? { scale: 1.02, x: 4 } : undefined}
                className="flex items-start gap-4 group"
              >
                <motion.div
                  whileHover={animate ? { scale: 1.15, rotate: [0, -8, 8, 0] } : undefined}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all duration-300 ${colorStyle}`}
                >
                  <Icon size={20} />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">{label}</p>
                  {href ? (
                    <a
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="font-semibold hover:opacity-70 transition-opacity flex items-center gap-1.5"
                    >
                      <span>{value}</span>
                    </a>
                  ) : (
                    <p className="font-semibold">{value}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Contact Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Message
              </label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help you?"
                className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none bg-white dark:bg-zinc-900"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-black text-white dark:bg-white dark:text-black rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <Spinner size="sm" className="border-white dark:border-black border-t-transparent" />
              ) : (
                <>
                  <Send size={16} />
                  Send Message
                </>
              )}
            </button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
