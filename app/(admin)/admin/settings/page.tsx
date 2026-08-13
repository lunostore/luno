"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Trash2,
  Video,
  Image as ImageIcon,
  Save,
  Sparkles,
  Sliders,
  Type,
  CreditCard,
  Share2,
  Info,
  FileText,
  Shield,
  ShieldAlert,
  Clock,
  Power,
  Key,
  Ruler,
  Plus,
  ExternalLink,
} from "lucide-react";

import { getSiteSettings, updateSiteSettings, type SiteSettings } from "@/lib/firebase/firestore";
import { DEFAULT_SHIPPING_POLICY_TEXT } from "@/constants/policies";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Spinner } from "@/components/ui/Spinner";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import type { CustomSizeChart } from "@/types/product";

type SettingsTab =
  | "maintenance"
  | "media"
  | "sizeCharts"
  | "about"
  | "policies"
  | "copy"
  | "payments"
  | "social";

function AdminSettingsContent() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as SettingsTab | null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("maintenance");

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const [testingTelegram, setTestingTelegram] = useState(false);

  const handleTestTelegram = async () => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      toast.error("يرجى كتابة توكن البوت (Bot Token) و (Chat ID) أولاً تجربة الإشعار");
      return;
    }
    setTestingTelegram(true);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isTest: true,
          botToken: settings.telegramBotToken.trim(),
          chatId: settings.telegramChatId.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("تم إرسال الإشعار التجريبي لبوت التلجرام بنجاح! 🚀");
      } else {
        toast.error(data.error || "فشل إرسال الإشعار التجريبي");
      }
    } catch {
      toast.error("حدث خطأ في الاتصال بالبوت");
    } finally {
      setTestingTelegram(false);
    }
  };

  const [settings, setSettings] = useState<SiteSettings>({
    storeName: "Luno Store",
    heroTagline: "LUNO IS YOURS",
    heroButtonText: "Shop Now",
    heroMediaType: "image",
    heroVideoUrlLight: "",
    heroVideoUrlDark: "",
    heroImagesLight: [],
    heroImagesDark: [],
    featuredTitle: "Our Collection",
    featuredSubtitle: "Curated for you",
    introTagline: "DEFINE YOUR STYLE",
    introImages: [],
    footerDescription: "Premium fashion for modern people. Elevate your style with our curated collections of high-quality clothing and accessories.",
    storeEmail: "lunoegypt@gmail.com",
    storePhone: "01107108679",
    vodafoneCash: "",
    instapayUsername: "@lunostore",
    vodafoneCashEnabled: true,
    instapayEnabled: true,
    onlinePaymentEnabled: true,
    instagramUrl: "https://www.instagram.com/lunos.store1?igsh=ajZvanBuYW0yMGtp",
    facebookUrl: "https://www.facebook.com/share/1D4P25PPrn/",
    tiktokUrl: "https://www.tiktok.com/@lunostore4?_r=1&_t=ZS-98ilUuI7eZG",
    currency: "EGP",
    aboutTitle: "About Luno Store",
    aboutSubtitle: "Defining style through modern luxury, premium materials, and minimal design.",
    aboutSection1Title: "Modern Minimalism",
    aboutSection1Text: "At Luno Store, we believe that style is a reflection of identity. We design garments that strip away the noise to focus on clean lines, flawless fits, and premium construction.",
    aboutSection1Image: "",
    aboutSection2Title: "Uncompromising Quality",
    aboutSection2Text: "We source only the finest fabrics—from extra-long staple cottons to sustainable technical fibers. By partnering with responsible manufacturers, we ensure every garment is built to last.",
    aboutSection2Image: "",
    privacyPolicyText: `Information We Collect
We collect information you provide directly to us, such as your name, phone number, delivery address, and payment method when you place an order.

How We Use Your Information
We use the information to process orders, communicate with you, and improve our services.

Data Security
We take reasonable measures to protect your information. Your payment info is never stored on our servers.`,
    termsOfServiceText: `Acceptance of Terms
By using Luno Store, you agree to these Terms of Service.

Orders & Payments
All orders are subject to availability. Payment must be completed within 24 hours.

Shipping & Delivery
We aim to ship all orders within 1–2 business days. Delivery takes 2–5 business days.`,
    shippingPolicyText: DEFAULT_SHIPPING_POLICY_TEXT,
    sizeCharts: [],
  });

  useEffect(() => {
    getSiteSettings()
      .then((data) => {
        if (data) {
          setSettings((prev) => ({
            ...prev,
            ...data,
            heroImagesLight: data.heroImagesLight || [],
            heroImagesDark: data.heroImagesDark || [],
            introImages: data.introImages || [],
            sizeCharts: data.sizeCharts || [],
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await updateSiteSettings(settings);
      toast.success("تم حفظ إعدادات وجداول مقاسات الموقع بنجاح!");
    } catch (err) {
      console.error(err);
      toast.error("فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const removeImageLight = (index: number) => {
    const imgUrl = settings.heroImagesLight?.[index];
    setSettings((prev) => ({
      ...prev,
      heroImagesLight: prev.heroImagesLight?.filter((_, i) => i !== index),
    }));
    if (imgUrl) deleteFromCloudinary(imgUrl).catch(console.error);
  };

  const removeImageDark = (index: number) => {
    const imgUrl = settings.heroImagesDark?.[index];
    setSettings((prev) => ({
      ...prev,
      heroImagesDark: prev.heroImagesDark?.filter((_, i) => i !== index),
    }));
    if (imgUrl) deleteFromCloudinary(imgUrl).catch(console.error);
  };

  const handleAddSizeChart = () => {
    if (!newSizeChartName.trim()) {
      toast.error("يرجى إدخال اسم جدول المقاسات (مثال: جدول مقاسات البنطلون)");
      return;
    }
    if (newSizeChartImages.length === 0) {
      toast.error("يرجى رفع صورة جدول المقاسات أولاً");
      return;
    }

    const newChart: CustomSizeChart = {
      id: `size_chart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newSizeChartName.trim(),
      imageUrl: newSizeChartImages[0],
    };

    const updatedCharts = [...(settings.sizeCharts || []), newChart];
    setSettings((prev) => ({
      ...prev,
      sizeCharts: updatedCharts,
    }));

    setNewSizeChartName("");
    setNewSizeChartImages([]);
    toast.success(`تمت إضافة "${newChart.name}" إلى قائمة جداول المقاسات!`);
  };

  const handleDeleteSizeChart = (id: string, imageUrl: string) => {
    if (!confirm("هل أنت تأكد من رغبتك في حذف جدول المقاسات هذا؟")) return;
    const updatedCharts = (settings.sizeCharts || []).filter((c) => c.id !== id);
    setSettings((prev) => ({
      ...prev,
      sizeCharts: updatedCharts,
    }));
    if (imageUrl) {
      deleteFromCloudinary(imageUrl).catch(console.error);
    }
    toast.success("تم حذف جدول المقاسات بنجاح");
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const TAB_DETAILS: Record<SettingsTab, { title: string; subtitle: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
    maintenance: { title: "الصيانة والتايمر", subtitle: "إعدادات وضع الصيانة والعد التنازلي للمتجر", icon: ShieldAlert },
    media: { title: "وسائط الهيرو والإنترو", subtitle: "إدارة فيديو وصور البنر الرئيسي وشاشة الدخول", icon: Sparkles },
    sizeCharts: { title: "جداول المقاسات المخصصة", subtitle: "إضافة وتعديل جداول مقاسات المنتجات", icon: Ruler },
    about: { title: "محتوى صفحة من نحن (About Us)", subtitle: "تعديل نصوص وصور صفحة من نحن الخاصة بالبراند", icon: Info },
    policies: { title: "الشروط والسياسات", subtitle: "تعديل سياسات الشحن والاستبدال والاسترجاع", icon: Shield },
    copy: { title: "نصوص وعناوين المتجر", subtitle: "تعديل اسم المتجر وشعارات الهيرو والفوتر", icon: Type },
    payments: { title: "بيانات الدفع والتواصل", subtitle: "تعديل رقم فودافون كاش ويوزر انستا باي وأرقام الدعم", icon: CreditCard },
    social: { title: "روابط التواصل الاجتماعي", subtitle: "تعديل حسابات إنستجرام وتيك توك وفيسبوك", icon: Share2 },
  };

  const currentTabInfo = TAB_DETAILS[activeTab] || TAB_DETAILS["maintenance"];
  const CurrentIcon = currentTabInfo.icon;

  return (
    <div className="space-y-6 w-full pb-16 font-sans" dir="rtl">
      {/* Sleek Header Bar for Current Active Section */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-amber-400 flex items-center justify-center font-black shadow-md shrink-0">
            <CurrentIcon size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              {currentTabInfo.title}
            </h1>
            <p className="text-zinc-500 text-xs mt-0.5 font-medium">
              {currentTabInfo.subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold text-xs hover:bg-zinc-800 transition-all shadow-md disabled:opacity-50 self-start sm:self-auto shrink-0 cursor-pointer"
        >
          {saving ? <Spinner size="sm" className="border-white" /> : <Save size={16} />}
          <span>حفظ التغييرات</span>
        </button>
      </div>

      {/* Tab Form Container — Full Width */}
      <form onSubmit={handleSave} className="space-y-6 w-full">
        {/* 1. MAINTENANCE & RESTOCK MODE TAB */}
        {activeTab === "maintenance" && (
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-zinc-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h2 className="font-black text-base text-white tracking-tight flex items-center gap-2">
                    وضع الصيانة وإضافة الاستوك (Restock & Maintenance)
                  </h2>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    عند تفعيل هذا الوضع يظهر لجميع زوار الموقع عداد تنازلي وسبب الصيانة، ويعود الموقع للعمل فور انتهاء العداد تلقائياً.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    maintenanceEnabled: !settings.maintenanceEnabled,
                  })
                }
                className={`flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl font-bold text-xs transition-all shadow-md ${
                  settings.maintenanceEnabled
                    ? "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                }`}
              >
                <Power size={15} />
                {settings.maintenanceEnabled ? "وضع الصيانة: مفصَّل (نشط ⚠️)" : "وضع الصيانة: مغلَق (الموقع يعمل 🟢)"}
              </button>
            </div>

            {/* Maintenance Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300">
                  عنوان الصيانة الرئيسي (Title)
                </label>
                <input
                  type="text"
                  placeholder="الموقع قيد الصيانة والتحديث 🚀"
                  value={settings.maintenanceTitle || ""}
                  onChange={(e) => setSettings({ ...settings, maintenanceTitle: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300">
                  سبب الصيانة المكتوب للعملاء (Reason)
                </label>
                <input
                  type="text"
                  placeholder="جاري إضافة تشكيلة جديدة وتحديث الاستوك... سنعود خلال دقائق!"
                  value={settings.maintenanceReason || ""}
                  onChange={(e) => setSettings({ ...settings, maintenanceReason: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Key size={13} className="text-amber-400" />
                  كود التجربة والتخطي السري (Bypass PIN)
                </label>
                <input
                  type="text"
                  placeholder="مثال: 1234"
                  value={settings.maintenancePin || ""}
                  onChange={(e) => setSettings({ ...settings, maintenancePin: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors font-mono font-bold"
                />
              </div>
            </div>

            {/* Timer Setup */}
            <div className="space-y-3 pt-4 border-t border-zinc-800/80">
              <label className="block text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Clock size={14} className="text-amber-400" />
                تحديد مدة الصيانة والعداد التنازلي (Countdown Timer Presets)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "15 دقيقة", mins: 15 },
                  { label: "30 دقيقة", mins: 30 },
                  { label: "ساعة واحدة", mins: 60 },
                  { label: "ساعتين", mins: 120 },
                  { label: "6 ساعات", mins: 360 },
                  { label: "12 ساعة", mins: 720 },
                  { label: "24 ساعة", mins: 1440 },
                ].map((preset) => {
                  const isSelected =
                    settings.maintenanceEndTime &&
                    Math.abs(
                      new Date(settings.maintenanceEndTime).getTime() -
                        (Date.now() + preset.mins * 60 * 1000)
                    ) < 120000;
                  return (
                    <button
                      key={preset.mins}
                      type="button"
                      onClick={() => {
                        const endTime = new Date(Date.now() + preset.mins * 60 * 1000).toISOString();
                        setSettings({
                          ...settings,
                          maintenanceEnabled: true,
                          maintenanceEndTime: endTime,
                        });
                        toast.success(`تم ضبط العداد لـ ${preset.label} وتفعيل الصيانة`);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? "bg-amber-500 text-black border-amber-400 shadow-md"
                          : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white"
                      }`}
                    >
                      +{preset.label}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      maintenanceEndTime: "",
                    })
                  }
                  className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all bg-zinc-900 border border-zinc-800 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
                >
                  إلغاء التايمر (صيانة بدون وقت محدد)
                </button>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <label className="text-xs text-zinc-400 font-medium whitespace-nowrap">
                  أو اختر تاريخ ووقت الانتهاء بدقة:
                </label>
                <input
                  type="datetime-local"
                  value={
                    settings.maintenanceEndTime
                      ? new Date(
                          new Date(settings.maintenanceEndTime).getTime() -
                            new Date().getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      const iso = new Date(e.target.value).toISOString();
                      setSettings({
                        ...settings,
                        maintenanceEnabled: true,
                        maintenanceEndTime: iso,
                      });
                    }
                  }}
                  className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
                {settings.maintenanceEndTime && (
                  <p className="text-[11px] font-mono text-amber-400 font-bold">
                    ينتهي في: {new Date(settings.maintenanceEndTime).toLocaleString("ar-EG")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. HERO & BANNER MEDIA TAB */}
        {activeTab === "media" && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                <h2 className="font-black text-sm text-zinc-900 uppercase tracking-wider">
                  إعدادات وسائط الهيرو والبنر والإنترو (Home Hero & Intro Media)
                </h2>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                نوع وسائط الهيرو
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, heroMediaType: "image" })}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all ${
                    settings.heroMediaType === "image"
                      ? "bg-zinc-900 text-white border-zinc-900 shadow-md"
                      : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  <ImageIcon size={16} />
                  بنر صور ثابتة / سلايد شو
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, heroMediaType: "video" })}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all ${
                    settings.heroMediaType === "video"
                      ? "bg-zinc-900 text-white border-zinc-900 shadow-md"
                      : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  <Video size={16} />
                  فيديو بنر (.mp4 / .webm)
                </button>
              </div>
            </div>

            {settings.heroMediaType === "video" && (
              <div className="space-y-4 pt-2 border-t border-zinc-100">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    رابط فيديو الوضع الفاتح (Light Mode Video URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com/hero-video-light.mp4"
                    value={settings.heroVideoUrlLight || ""}
                    onChange={(e) => setSettings({ ...settings, heroVideoUrlLight: e.target.value })}
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    رابط فيديو الوضع الداكن (Dark Mode Video URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com/hero-video-dark.mp4"
                    value={settings.heroVideoUrlDark || ""}
                    onChange={(e) => setSettings({ ...settings, heroVideoUrlDark: e.target.value })}
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>
            )}

            {settings.heroMediaType === "image" && (
              <div className="space-y-6 pt-2 border-t border-zinc-100">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-3">
                    صور البنر للوضع الفاتح (Light Mode)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {settings.heroImagesLight?.map((img, i) => (
                      <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 group bg-zinc-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`Light Banner ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImageLight(i)}
                          className="absolute top-1.5 right-1.5 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="حذف الصورة"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <ImageUploader
                    id="hero-images-light-uploader"
                    multiple={true}
                    images={settings.heroImagesLight || []}
                    onChange={(newImgs) => setSettings((prev) => ({ ...prev, heroImagesLight: newImgs }))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-3">
                    صور البنر للوضع الداكن (Dark Mode)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {settings.heroImagesDark?.map((img, i) => (
                      <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 group bg-zinc-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`Dark Banner ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImageDark(i)}
                          className="absolute top-1.5 right-1.5 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="حذف الصورة"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <ImageUploader
                    id="hero-images-dark-uploader"
                    multiple={true}
                    images={settings.heroImagesDark || []}
                    onChange={(newImgs) => setSettings((prev) => ({ ...prev, heroImagesDark: newImgs }))}
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-zinc-100 space-y-3">
              <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider">
                صور خلفية الإنترو الخاصة (Intro Background Photos)
              </label>
              <p className="text-xs text-zinc-500">
                ارفع صوراً خاصة بعرض الإنترو السينمائي (ستظهر في خلفية الإنترو عند دخول الزائر للموقع)
              </p>
              <ImageUploader
                id="intro-background-images-uploader"
                multiple={true}
                images={settings.introImages || []}
                onChange={(newImgs) => setSettings((prev) => ({ ...prev, introImages: newImgs }))}
              />
            </div>
          </div>
        )}

        {/* 3. CUSTOM SIZE CHARTS MANAGEMENT TAB */}
        {activeTab === "sizeCharts" && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 sm:p-8 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
              <div>
                <h2 className="font-black text-sm text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <Ruler size={18} className="text-amber-500" />
                  إدارة جداول المقاسات المخصصة (Custom Size Charts Manager)
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  قم برفع جدول المقاسات مع الاسم الخاص به (مثل: جدول مقاسات البنطلون، جدول مقاسات الهودي)، واختياره مباشرة عند رفع المنتجات.
                </p>
              </div>
            </div>

            {/* Form to Add New Size Chart */}
            <div className="p-5 sm:p-6 bg-zinc-50/80 rounded-2xl border border-zinc-200/80 space-y-4">
              <h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <Plus size={16} className="text-amber-500" />
                إضافة جدول مقاسات جديد
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-700">
                    اسم جدول المقاسات (مثل: جدول مقاسات الهودي)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: جدول مقاسات البنطلون الجينز"
                    value={newSizeChartName}
                    onChange={(e) => setNewSizeChartName(e.target.value)}
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-700">
                    صورة جدول المقاسات
                  </label>
                  <ImageUploader
                    id="new-size-chart-uploader"
                    multiple={false}
                    images={newSizeChartImages}
                    onChange={(imgs) => setNewSizeChartImages(imgs)}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleAddSizeChart}
                  className="inline-flex items-center gap-2 bg-zinc-900 text-white px-5 py-3 rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all shadow-md"
                >
                  <Plus size={15} />
                  إضافة جدول المقاسات للقائمة
                </button>
              </div>
            </div>

            {/* List of Custom Size Charts */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                جداول المقاسات المتاحة حالياً ({settings.sizeCharts?.length || 0})
              </h3>

              {(!settings.sizeCharts || settings.sizeCharts.length === 0) ? (
                <div className="p-12 text-center border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-400 text-xs font-medium">
                  لا توجد جداول مقاسات مضافة حتى الآن. استخدم النموذج أعلاه لرفع جدول مقاسات جديد.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {settings.sizeCharts.map((chart) => (
                    <div
                      key={chart.id}
                      className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-sm space-y-3 relative group"
                    >
                      <div className="aspect-[4/3] relative rounded-xl overflow-hidden bg-zinc-950 border border-zinc-100 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={chart.imageUrl}
                          alt={chart.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs text-zinc-900 truncate">{chart.name}</h4>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewChart(chart)}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
                            title="معاينة"
                          >
                            <ExternalLink size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSizeChart(chart.id, chart.imageUrl)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. ABOUT US PAGE TAB */}
        {activeTab === "about" && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
              <Info size={18} className="text-zinc-900" />
              <h2 className="font-black text-sm text-zinc-900 uppercase tracking-wider">
                محتوى وصور صفحة &quot;من نحن&quot; (About Us)
              </h2>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    عنوان صفحة من نحن الرئيسي
                  </label>
                  <input
                    type="text"
                    value={settings.aboutTitle || ""}
                    onChange={(e) => setSettings({ ...settings, aboutTitle: e.target.value })}
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    العنوان الفرعي لصفحة من نحن
                  </label>
                  <input
                    type="text"
                    value={settings.aboutSubtitle || ""}
                    onChange={(e) => setSettings({ ...settings, aboutSubtitle: e.target.value })}
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              {/* Section 1 Edit */}
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/60 space-y-3">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">الجزء الأول: الفلسفة والتصميم (Modern Minimalism)</h3>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    عنوان الجزء الأول
                  </label>
                  <input
                    type="text"
                    value={settings.aboutSection1Title || ""}
                    onChange={(e) => setSettings({ ...settings, aboutSection1Title: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-zinc-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    فقرة الوصف للجزء الأول
                  </label>
                  <textarea
                    rows={3}
                    value={settings.aboutSection1Text || ""}
                    onChange={(e) => setSettings({ ...settings, aboutSection1Text: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-zinc-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    صورة الجزء الأول
                  </label>
                  <ImageUploader
                    id="about-section-1-image-uploader"
                    multiple={false}
                    images={settings.aboutSection1Image ? [settings.aboutSection1Image] : []}
                    onChange={(imgs) => setSettings((prev) => ({ ...prev, aboutSection1Image: imgs[imgs.length - 1] || "" }))}
                  />
                </div>
              </div>

              {/* Section 2 Edit */}
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/60 space-y-3">
                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">الجزء الثاني: الجودة والخامات (Uncompromising Quality)</h3>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    عنوان الجزء الثاني
                  </label>
                  <input
                    type="text"
                    value={settings.aboutSection2Title || ""}
                    onChange={(e) => setSettings({ ...settings, aboutSection2Title: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-zinc-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    فقرة الوصف للجزء الثاني
                  </label>
                  <textarea
                    rows={3}
                    value={settings.aboutSection2Text || ""}
                    onChange={(e) => setSettings({ ...settings, aboutSection2Text: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-zinc-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    صورة الجزء الثاني
                  </label>
                  <ImageUploader
                    id="about-section-2-image-uploader"
                    multiple={false}
                    images={settings.aboutSection2Image ? [settings.aboutSection2Image] : []}
                    onChange={(imgs) => setSettings((prev) => ({ ...prev, aboutSection2Image: imgs[imgs.length - 1] || "" }))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. POLICIES & LEGAL TAB */}
        {activeTab === "policies" && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
              <Shield size={18} className="text-zinc-900" />
              <h2 className="font-black text-sm text-zinc-900 uppercase tracking-wider">
                نصوص سياسة الخصوصية والشروط وسياسة الشحن
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">
                  <FileText size={14} />
                  نص سياسة الخصوصية (Privacy Policy)
                </label>
                <textarea
                  rows={8}
                  value={settings.privacyPolicyText || ""}
                  onChange={(e) => setSettings({ ...settings, privacyPolicyText: e.target.value })}
                  placeholder="أدخل نص سياسة الخصوصية..."
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-900 leading-relaxed font-mono"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">
                  <FileText size={14} />
                  نص الشروط والأحكام (Terms of Service)
                </label>
                <textarea
                  rows={8}
                  value={settings.termsOfServiceText || ""}
                  onChange={(e) => setSettings({ ...settings, termsOfServiceText: e.target.value })}
                  placeholder="أدخل نص الشروط والأحكام..."
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-900 leading-relaxed font-mono"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">
                  <FileText size={14} />
                  سياسة الشحن والاسترجاع (Shipping & Returns Policy)
                </label>
                <textarea
                  rows={12}
                  value={settings.shippingPolicyText || ""}
                  onChange={(e) => setSettings({ ...settings, shippingPolicyText: e.target.value })}
                  placeholder="أدخل نص سياسة الشحن والاسترجاع..."
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-zinc-900 leading-relaxed font-mono"
                  dir="rtl"
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. WEBSITE COPY TAB */}
        {activeTab === "copy" && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
              <Type size={18} className="text-zinc-900" />
              <h2 className="font-black text-sm text-zinc-900 uppercase tracking-wider">
                عناوين ونصوص المتجر
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  اسم المتجر
                </label>
                <input
                  type="text"
                  value={settings.storeName || ""}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  رمز العملة
                </label>
                <input
                  type="text"
                  value={settings.currency || "EGP"}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  شعار الهيرو الفرعي (Tagline)
                </label>
                <input
                  type="text"
                  value={settings.heroTagline || ""}
                  onChange={(e) => setSettings({ ...settings, heroTagline: e.target.value })}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  نص زر الشراء الرئيسي بالهيرو
                </label>
                <input
                  type="text"
                  value={settings.heroButtonText || ""}
                  onChange={(e) => setSettings({ ...settings, heroButtonText: e.target.value })}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  عنوان قسم الكتالوج بالرئيسية
                </label>
                <input
                  type="text"
                  value={settings.featuredTitle || ""}
                  onChange={(e) => setSettings({ ...settings, featuredTitle: e.target.value })}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  العنوان الفرعي لقسم الكتالوج
                </label>
                <input
                  type="text"
                  value={settings.featuredSubtitle || ""}
                  onChange={(e) => setSettings({ ...settings, featuredSubtitle: e.target.value })}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  الشعار المتحرك بالإنترو (Intro Tagline)
                </label>
                <input
                  type="text"
                  value={settings.introTagline || ""}
                  onChange={(e) => setSettings({ ...settings, introTagline: e.target.value })}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  وصف الفوتر أسفل الموقع
                </label>
                <textarea
                  rows={3}
                  value={settings.footerDescription || ""}
                  onChange={(e) => setSettings({ ...settings, footerDescription: e.target.value })}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* 7. PAYMENTS & CONTACT DETAILS TAB */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
              <CreditCard size={18} className="text-zinc-900" />
              <h2 className="font-black text-sm text-zinc-900 uppercase tracking-wider">
                بيانات الدفع والتواصل
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Vodafone Cash */}
              <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-zinc-900">
                      {settings.vodafoneCashEnabled !== false ? "✅ فودافون كاش مفعّل" : "🔴 فودافون كاش معطّل"}
                    </p>
                    <p className="text-[10px] text-zinc-500">طريقة دفع فودافون كاش</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, vodafoneCashEnabled: settings.vodafoneCashEnabled === false })}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none shadow-inner ${
                      settings.vodafoneCashEnabled !== false ? "bg-emerald-500" : "bg-zinc-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                        settings.vodafoneCashEnabled !== false ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 text-right">
                    رقم فودافون كاش للتحويل
                  </label>
                  <input
                    type="text"
                    value={settings.vodafoneCash || ""}
                    onChange={(e) => setSettings({ ...settings, vodafoneCash: e.target.value })}
                    placeholder="011xxxxxxx"
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900 bg-white"
                  />
                </div>
              </div>

              {/* InstaPay */}
              <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-zinc-900">
                      {settings.instapayEnabled !== false ? "✅ انستا باي (InstaPay) مفعّل" : "🔴 انستا باي (InstaPay) معطّل"}
                    </p>
                    <p className="text-[10px] text-zinc-500">طريقة دفع انستا باي</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, instapayEnabled: settings.instapayEnabled === false })}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none shadow-inner ${
                      settings.instapayEnabled !== false ? "bg-emerald-500" : "bg-zinc-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                        settings.instapayEnabled !== false ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 text-right">
                    حساب / يوزر انستا باي (InstaPay)
                  </label>
                  <input
                    type="text"
                    value={settings.instapayUsername || ""}
                    onChange={(e) => setSettings({ ...settings, instapayUsername: e.target.value })}
                    placeholder="username@instapay"
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900 bg-white"
                  />
                </div>
              </div>

              {/* Online Payment */}
              <div className="sm:col-span-2">
                <div className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 ${
                  settings.onlinePaymentEnabled !== false
                    ? "border-green-300 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}>
                  <div>
                    <p className="text-sm font-black text-zinc-900">
                      {settings.onlinePaymentEnabled !== false ? "✅ الدفع المسبق أونلاين مفعّل كلياً" : "🔴 الدفع المسبق أونلاين معطّل كلياً"}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {settings.onlinePaymentEnabled !== false
                        ? "العملاء يقدرون يدفعوا بطرق الدفع الأونلاين المفعّلة أعلاه"
                        : "الدفع عند الاستلام (COD) فقط — خيارات الأونلاين مخفية تماماً"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, onlinePaymentEnabled: settings.onlinePaymentEnabled === false })}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none shadow-inner ${
                      settings.onlinePaymentEnabled !== false ? "bg-green-500" : "bg-zinc-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                        settings.onlinePaymentEnabled !== false ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  البريد الإلكتروني للدعم
                </label>
                <input
                  type="email"
                  value={settings.storeEmail || ""}
                  onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  رقم الهاتف للدعم
                </label>
                <input
                  type="text"
                  value={settings.storePhone || ""}
                  onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900"
                />
              </div>

              {/* Telegram Bot Integration Card */}
              <div className="sm:col-span-2 p-5 rounded-3xl border border-blue-100 bg-blue-50/50 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
                      ✈️
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider">
                        إشعارات بوت التلجرام للطلبات (Telegram Order Bot)
                      </h3>
                      <p className="text-[11px] text-blue-800 font-medium">
                        إرسال رسالة تلقائية منسقة فوراً لتلجرام مع كل أوردر جديد
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, telegramEnabled: settings.telegramEnabled === false })}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none shadow-inner ${
                      settings.telegramEnabled !== false ? "bg-blue-600" : "bg-zinc-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                        settings.telegramEnabled !== false ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                      توكن البوت (Telegram Bot Token)
                    </label>
                    <input
                      type="password"
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      value={settings.telegramBotToken || ""}
                      onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-blue-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-blue-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                      معرف الشات/القناة (Telegram Chat ID)
                    </label>
                    <input
                      type="text"
                      placeholder="-100xxxxxxxxx أو @your_channel"
                      value={settings.telegramChatId || ""}
                      onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-blue-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-blue-600 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-blue-100/80">
                  <p className="text-[10px] text-blue-700 font-medium">
                    💡 يمكنك إنشائه مجاناً من BotFather وكتابة الـ Chat ID هنا.
                  </p>
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={testingTelegram}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {testingTelegram ? <Spinner size="sm" className="border-white" /> : "🧪 إرسال إشعار تجريبي"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. SOCIAL MEDIA LINKS TAB */}
        {activeTab === "social" && (
          <div className="bg-white rounded-3xl border border-zinc-100 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
              <Share2 size={18} className="text-zinc-900" />
              <h2 className="font-black text-sm text-zinc-900 uppercase tracking-wider">
                روابط التواصل الاجتماعي
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  رابط حساب إنستجرام (Instagram)
                </label>
                <input
                  type="text"
                  value={settings.instagramUrl || ""}
                  onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  رابط صفحة فيسبوك (Facebook)
                </label>
                <input
                  type="text"
                  value={settings.facebookUrl || ""}
                  onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  رابط حساب تيك توك (TikTok)
                </label>
                <input
                  type="text"
                  value={settings.tiktokUrl || ""}
                  onChange={(e) => setSettings({ ...settings, tiktokUrl: e.target.value })}
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-zinc-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Global Save Button at Bottom */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200/60">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-zinc-800 transition-all shadow-xl disabled:opacity-50"
          >
            {saving ? <Spinner size="sm" className="border-white" /> : <Save size={16} />}
            حفظ كافة التغييرات وجداول المقاسات
          </button>
        </div>
      </form>

      {/* Preview Size Chart Modal */}
      {previewChart && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 text-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-black text-sm text-white">{previewChart.name}</h3>
              <button
                type="button"
                onClick={() => setPreviewChart(null)}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
            <div className="flex justify-center p-2 bg-black rounded-2xl border border-zinc-800 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewChart.imageUrl}
                alt={previewChart.name}
                className="max-h-[70vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <AdminSettingsContent />
    </Suspense>
  );
}
