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
SHIPPING_USERNAME = os.getenv("SHIPPING_USERNAME", "")
SHIPPING_PASSWORD = os.getenv("SHIPPING_PASSWORD", "")

# ─── Automation Options ───────────────────────────────
HEADLESS       = os.getenv("HEADLESS", "false").lower() == "true"
AUTO_DOWNLOAD  = os.getenv("AUTO_DOWNLOAD_LABEL", "true").lower() == "true"
LABELS_DIR     = os.getenv("LABELS_DIR", "./storage/labels")

# ─── Telegram Notification (Optional) ─────────────────
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID   = os.getenv("TELEGRAM_CHAT_ID", "")
