"""
Luno Store — Governorate Mapping for Wassalha (Egypt Post)

Maps Arabic governorate names from Luno Store checkout form
to the corresponding values in Wassalha's shipping form dropdowns.

⚠️ Important: The WASSALHA_VALUES below need to be verified against the actual
   <select> options in the Wassalha dashboard. After logging in:
   1. Go to the "Create Shipment" page
   2. Inspect the governorate dropdown
   3. Update the values below to match exactly
"""

# Mapping: Luno Store nameAr → Wassalha dropdown value
# The keys are the Arabic names stored in Firestore (from checkout form)
# The values should match the <option value="..."> in Wassalha's governorate select
GOVERNORATE_MAP: dict[str, str] = {
    "القاهرة":        "القاهرة",
    "الجيزة":         "الجيزة",
    "القليوبية":      "القليوبية",
    "الإسكندرية":     "الإسكندرية",
    "البحيرة":        "البحيرة",
    "مطروح":          "مطروح",
    "الغربية":        "الغربية",
    "المنوفية":       "المنوفية",
    "الدقهلية":       "الدقهلية",
    "كفر الشيخ":      "كفر الشيخ",
    "الشرقية":        "الشرقية",
    "دمياط":          "دمياط",
    "بورسعيد":        "بورسعيد",
    "الإسماعيلية":    "الإسماعيلية",
    "السويس":         "السويس",
    "شمال سيناء":     "شمال سيناء",
    "جنوب سيناء":     "جنوب سيناء",
    "بني سويف":       "بني سويف",
    "الفيوم":         "الفيوم",
    "المنيا":         "المنيا",
    "أسيوط":          "أسيوط",
    "سوهاج":          "سوهاج",
    "قنا":            "قنا",
    "الأقصر":         "الأقصر",
    "أسوان":          "أسوان",
    "البحر الأحمر":   "البحر الأحمر",
    "الوادي الجديد":  "الوادي الجديد",
}


def get_shipping_value(governorate_ar: str) -> str:
    """
    Convert the Arabic governorate name from Luno Store
    to the corresponding value in Wassalha's dropdown.

    Falls back to the original name if no mapping found.
    """
    if not governorate_ar:
        return ""
    return GOVERNORATE_MAP.get(governorate_ar.strip(), governorate_ar.strip())


def get_all_governorates() -> list[str]:
    """Return all supported governorate names."""
    return list(GOVERNORATE_MAP.keys())
