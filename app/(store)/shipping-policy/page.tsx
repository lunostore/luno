"use client";

import { useEffect, useState } from "react";
import { Truck, ShieldCheck, RefreshCw, AlertCircle, PhoneCall, Package } from "lucide-react";
import { getSiteSettings, type SiteSettings } from "@/lib/firebase/firestore";
import { DEFAULT_SHIPPING_POLICY_TEXT } from "@/constants/policies";

export default function ShippingPolicyPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSiteSettings()
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch(console.error);
  }, []);

  const policyContent = settings?.shippingPolicyText || DEFAULT_SHIPPING_POLICY_TEXT;

  return (
    <div className="pt-24 pb-20 min-h-screen bg-white dark:bg-black text-foreground font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Badge */}
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3">
          <Truck size={18} className="animate-bounce" />
          سياسات LUNO الرسمية
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-zinc-950 dark:text-white">
          سياسة الشحن والاسترجاع
        </h1>
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-10">
          آخر تحديث: 2026 | يرجى قراءة الشروط والتعليمات قبل إتمام الطلب
        </p>

        {/* Highlight Cards Quick Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Package size={20} />
            </div>
            <h2 className="font-black text-sm text-zinc-900 dark:text-white">تجهيز سريع وشحن آمن</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              تأكيد بيانات العنوان قبل التوصيل لضمان استلام منتجك بأعلى جودة وفي أقصر مدة.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <RefreshCw size={20} />
            </div>
            <h2 className="font-black text-sm text-zinc-900 dark:text-white">استبدال وسلسلة مرتجعات</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              إمكانية استبدال المقاس بشرط عدم استخدام المنتج والاحتفاظ بالتغليف والتاجز الأصلية.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h2 className="font-black text-sm text-zinc-900 dark:text-white">ضمان عيوب التصنيع</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              فريق الدعم يوفر الحل المباشر في حالة وجود عيب تصنيع أو خطأ بالطلب فور التواصل.
            </p>
          </div>
        </div>

        {/* Policy Details Container */}
        <div className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="prose dark:prose-invert max-w-none space-y-6 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium">
            {policyContent}
          </div>
        </div>

        {/* Direct Help Footer Section */}
        <div className="mt-12 p-6 rounded-2xl bg-black dark:bg-zinc-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <PhoneCall size={20} />
            </div>
            <div>
              <p className="font-black text-sm">هل لديك أي استفسار بخصوص شحنتك؟</p>
              <p className="text-xs text-zinc-400">فريق خدمة العملاء متواجد للمساعدة والمتابعة معكم.</p>
            </div>
          </div>
          <a
            href="/contact"
            className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 transition-colors rounded-xl font-bold text-xs whitespace-nowrap shadow-md"
          >
            تواصل معنا الآن
          </a>
        </div>
      </div>
    </div>
  );
}
