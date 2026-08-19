"""
Luno Store — Shipping Automation Config
Reads environment variables from .env file.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ─── Firebase ──────────────────────────────────────────
FIREBASE_SA_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "./service-account.json")

# ─── Shipping Provider (Wassalha / Egypt Post) ────────
SHIPPING_URL      = os.getenv("SHIPPING_SITE_URL", "https://wassalha.egyptpost.org")
SHIPPING_USERNAME = os.getenv("SHIPPING_USERNAME") or os.getenv("VARS_SHIPPING_USERNAME", "")
SHIPPING_PASSWORD = os.getenv("SHIPPING_PASSWORD") or os.getenv("VARS_SHIPPING_PASSWORD", "")

# ─── Automation Options ───────────────────────────────
HEADLESS       = os.getenv("HEADLESS", "false").lower() == "true"
AUTO_DOWNLOAD  = os.getenv("AUTO_DOWNLOAD_LABEL", "true").lower() == "true"
# ─── Validation Helper ─────────────────────────────────
def validate_config() -> tuple[bool, list[str]]:
    """Verify all required environment variables and service-account file exist."""
    errors = []
    if not SHIPPING_USERNAME:
        errors.append("اسم المستخدم SHIPPING_USERNAME غير مضاف")
    if not SHIPPING_PASSWORD:
        errors.append("كلمة المرور SHIPPING_PASSWORD غير مضافة")
    
    if not os.path.exists(FIREBASE_SA_PATH):
        errors.append("ملف Firebase service-account.json غير موجود")
    else:
        try:
            import json
            with open(FIREBASE_SA_PATH, "r", encoding="utf-8") as f:
                content = json.load(f)
                if not content or "project_id" not in content:
                    errors.append("ملف FIREBASE_SERVICE_ACCOUNT_JSON فارغ أو غير صالح (ينقص project_id)")
        except Exception as e:
            errors.append(f"محتوى ملف FIREBASE_SERVICE_ACCOUNT_JSON غير صالح JSON ({e})")
            
    return len(errors) == 0, errors
