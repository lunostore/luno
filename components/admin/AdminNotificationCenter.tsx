"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ShoppingCart,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCheck,
  Trash2,
  ExternalLink,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import {
  subscribeAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  type AdminNotification,
} from "@/lib/firebase/firestore";

/** Play a pleasant soft audio chime synthesizer on new unread notifications */
function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignore audio autoplay restrictions gracefully
  }
}

export function AdminNotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevUnreadCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const unsubscribe = subscribeAdminNotifications((items) => {
      setNotifications(items);
      const currentUnread = items.filter((n) => !n.read).length;

      // If new unread notification arrived after initial load, play sound & show toast
      if (!isInitialLoadRef.current && currentUnread > prevUnreadCountRef.current) {
        if (soundEnabled) {
          playNotificationChime();
        }
        const newest = items.find((n) => !n.read);
        if (newest) {
          toast.info(newest.title, {
            description: newest.message,
            duration: 5000,
          });
        }
      }

      isInitialLoadRef.current = false;
      prevUnreadCountRef.current = currentUnread;
    });

    return () => unsubscribe();
  }, [soundEnabled]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: AdminNotification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
    setOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return "الآن";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "منذ لحظات";
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  const getTypeIcon = (type: AdminNotification["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingCart size={15} className="text-emerald-600" />;
      case "message":
        return <MessageSquare size={15} className="text-blue-600" />;
      case "stock":
        return <AlertTriangle size={15} className="text-amber-600" />;
      default:
        return <Info size={15} className="text-purple-600" />;
    }
  };

  const getTypeBadgeClass = (type: AdminNotification["type"]) => {
    switch (type) {
      case "order":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "message":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "stock":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-purple-50 text-purple-700 border-purple-200";
    }
  };

  return (
    <div className="relative" ref={dropdownRef} dir="rtl">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative p-2.5 rounded-2xl transition-all duration-300 border focus:outline-none ${
          open
            ? "bg-zinc-900 text-white border-zinc-900 shadow-lg"
            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200/80"
        }`}
        title="مركز الإشعارات والتنبيهات"
      >
        <Bell size={18} className={unreadCount > 0 ? "animate-pulse" : ""} />

        {/* Unread Red Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-md">
            {unreadCount > 99 ? "+99" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Floating Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="absolute left-0 sm:left-auto right-auto sm:right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl border border-zinc-200/90 shadow-2xl z-50 overflow-hidden"
          >
            {/* Panel Header */}
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-zinc-950 flex items-center justify-center font-black">
                  🔔
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    مركز الإشعارات
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    {unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : "جميع الإشعارات مقروءة"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Mute/Unmute sound toggle */}
                <button
                  type="button"
                  onClick={() => setSoundEnabled((prev) => !prev)}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  title={soundEnabled ? "كتم الصوت" : "تشغيل الصوت"}
                >
                  {soundEnabled ? <Volume2 size={14} className="text-amber-400" /> : <VolumeX size={14} />}
                </button>

                {/* Mark all as read */}
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllNotificationsAsRead(notifications)}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors"
                    title="تحديد الكل كمقروء"
                  >
                    <CheckCheck size={14} />
                  </button>
                )}

                {/* Clear all */}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => clearAllNotifications(notifications)}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
                    title="مسح الإشعارات"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100 bg-zinc-50/50">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 space-y-2">
                  <Bell size={28} className="mx-auto text-zinc-300 stroke-[1.5]" />
                  <p className="text-xs font-bold text-zinc-500">لا توجد إشعارات حالياً ✨</p>
                  <p className="text-[10px] text-zinc-400">ستظهر التنبيهات والأوردرات الجديدة هنا فوراً</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3.5 flex items-start gap-3 transition-all cursor-pointer hover:bg-white ${
                      !notification.read ? "bg-amber-50/40 border-r-4 border-r-amber-500" : "bg-white/60 opacity-85"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm ${getTypeBadgeClass(
                        notification.type
                      )}`}
                    >
                      {getTypeIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-zinc-900 truncate">
                          {notification.title}
                        </h4>
                        <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600 line-clamp-2 mt-0.5 leading-relaxed font-medium">
                        {notification.message}
                      </p>
                    </div>

                    {/* Navigation arrow */}
                    {notification.link && (
                      <ExternalLink size={12} className="text-zinc-400 shrink-0 self-center opacity-50" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Panel Footer */}
            {notifications.length > 0 && (
              <div className="p-2.5 bg-white border-t border-zinc-100 text-center">
                <button
                  type="button"
                  onClick={() => markAllNotificationsAsRead(notifications)}
                  className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  تحديد جميع الإشعارات كمقروءة ✓
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
