"use client";

import { useEffect, useState } from "react";
import { Truck, Search, Save, RefreshCw, Scale, MapPin, Zap } from "lucide-react";
import { getShippingRates, updateShippingRates } from "@/lib/firebase/firestore";
import { SHIPPING_MATRIX, type GovernorateRate } from "@/constants/governorates";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminShippingPage() {
  const [rates, setRates] = useState<GovernorateRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("CAIRO");

  const loadRates = async () => {
    setLoading(true);
    try {
      const data = await getShippingRates();
      setRates(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load shipping rates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  const handlePriceChange = (id: string, rawVal: string) => {
    setRates((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (rawVal === "") {
          return { ...r, price: 0 };
        }
        const parsed = parseFloat(rawVal);
        return { ...r, price: isNaN(parsed) ? 0 : Math.max(0, parsed) };
      })
    );
  };

  const handleAdditionalPriceChange = (id: string, rawVal: string) => {
    setRates((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (rawVal === "") {
          return { ...r, additionalKgPrice: 7 };
        }
        const parsed = parseFloat(rawVal);
        return { ...r, additionalKgPrice: isNaN(parsed) ? 7 : Math.max(0, parsed) };
      })
    );
  };

  const handleToggleActive = (id: string) => {
    setRates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  const applyOriginMatrixPresets = (originKey: string) => {
    const originMatrix = SHIPPING_MATRIX[originKey];
    if (!originMatrix) return;

    // Map origin matrix keys to governorate rates
    setRates((prev) =>
      prev.map((r) => {
        const matrixKey = r.nameEn.toUpperCase().replace(/\s+/g, "_");
        const matchedPrice = originMatrix[matrixKey] ?? originMatrix[r.id.toUpperCase()] ?? r.price;
        return {
          ...r,
          price: matchedPrice,
          additionalKgPrice: 7,
        };
      })
    );
    toast.success(`تم إدراج أسعار الشحن المبدئية للشحن من محافظة: ${originKey}`);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const sanitized = rates.map((r) => ({
        ...r,
        price: typeof r.price === "number" && !isNaN(r.price) ? r.price : (parseFloat(String(r.price)) || 0),
        additionalKgPrice: typeof r.additionalKgPrice === "number" && !isNaN(r.additionalKgPrice) ? r.additionalKgPrice : 7,
      }));
      await updateShippingRates(sanitized);
      toast.success("تم حفظ أسعار الشحن لجميع المحافظات بنجاح في قاعدة البيانات!");
    } catch (err) {
      console.error(err);
      toast.error("فشل حفظ أسعار الشحن");
    } finally {
      setSaving(false);
    }
  };

  const filtered = rates.filter(
    (r) =>
      r.nameAr.includes(search) ||
      r.nameEn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Truck className="text-amber-500" size={24} />
            Egyptian Governorates Shipping Management (أسعار الشحن للمحافظات)
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Configure custom shipping rates for all 27 Egyptian governorates. Changes apply instantly to customer checkout.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRates}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Reload
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-zinc-900 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {saving ? <Spinner size="sm" className="border-white" /> : <Save size={15} />}
            Save Shipping Rates
          </button>
        </div>
      </div>

      {/* Shipping Rate Rules Card */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 text-white p-6 rounded-2xl border border-zinc-800 shadow-md space-y-4" dir="rtl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scale size={20} />
            </div>
            <div>
              <h2 className="font-black text-sm text-white">قواعد الشحن وزيادة الوزن (Door to Door Weight Rules)</h2>
              <p className="text-xs text-zinc-400 mt-0.5">أول 1000 جرام السعر الأساسي + 7.00 ج.م لكل 1000 جرام إضافي</p>
            </div>
          </div>

          {/* Matrix preset picker */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1">
              <MapPin size={13} className="text-amber-400" />
              موقع المتجر (المرسل):
            </label>
            <select
              value={selectedOrigin}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedOrigin(val);
                applyOriginMatrixPresets(val);
              }}
              className="bg-zinc-800 text-white border border-zinc-700 text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-400"
            >
              {Object.keys(SHIPPING_MATRIX).map((og) => (
                <option key={og} value={og}>
                  {og}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => applyOriginMatrixPresets(selectedOrigin)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black rounded-xl transition-all flex items-center gap-1 shadow-md"
            >
              <Zap size={13} />
              تطبيق الجدول المبدئي
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium text-zinc-300 pt-1">
          <div className="flex items-center gap-2 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>الوزن المبدئي الأساسي: <strong>1000 جرام (1 كجم)</strong></span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/50">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>الوزن الإضافي: <strong>+7.00 ج.م لكل 1 كجم زيادة</strong></span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/50">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>التوصيل: <strong>من الباب إلى الباب (Door to Door)</strong></span>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md bg-white rounded-2xl border border-zinc-200/80 p-2 shadow-sm">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search governorate by Arabic or English name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-transparent text-xs font-semibold focus:outline-none"
        />
      </div>

      {/* Governorates Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-16 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Spinner size="lg" />
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Loading Governorates Shipping Data...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-100 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Governorate (المحافظة)</th>
                  <th className="px-6 py-4 text-left">English Name</th>
                  <th className="px-6 py-4 text-left">Base Shipping (أول 1 كجم)</th>
                  <th className="px-6 py-4 text-left">Extra 1000g (+كجم إضافي)</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((rate) => (
                  <tr key={rate.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-black text-zinc-900">
                      {rate.nameAr}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-500 font-mono">
                      {rate.nameEn}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 max-w-[160px]">
                        <input
                          type="number"
                          min="0"
                          value={rate.price ?? ""}
                          onChange={(e) => handlePriceChange(rate.id, e.target.value)}
                          className="w-24 px-3 py-1.5 border border-zinc-200 rounded-xl text-xs font-black text-zinc-900 focus:outline-none focus:border-zinc-900 bg-white"
                        />
                        <span className="text-xs font-bold text-zinc-400">EGP</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 max-w-[160px]">
                        <input
                          type="number"
                          min="0"
                          value={rate.additionalKgPrice ?? 7}
                          onChange={(e) => handleAdditionalPriceChange(rate.id, e.target.value)}
                          className="w-24 px-3 py-1.5 border border-zinc-200 rounded-xl text-xs font-black text-zinc-900 focus:outline-none focus:border-zinc-900 bg-white"
                        />
                        <span className="text-xs font-bold text-zinc-400">EGP</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(rate.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all ${
                          rate.active
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                        }`}
                      >
                        {rate.active ? "Active" : "Disabled"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

