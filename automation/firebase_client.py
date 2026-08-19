"""
Luno Store — Firebase Client for Shipping Automation
Connects to Firestore to read orders and update tracking info.
"""
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from config import FIREBASE_SA_PATH
from logger import log


def init_firebase():
    """Initialize Firebase Admin SDK (safe to call multiple times)."""
    if not firebase_admin._apps:
        cred = credentials.Certificate(FIREBASE_SA_PATH)
        firebase_admin.initialize_app(cred)
    return firestore.client()


db = init_firebase()


def get_ready_orders() -> list[dict]:
    """
    جلب الطلبات المؤكدة التي ليس لها رقم تتبع بعد.
    Status: "confirmed" AND no trackingNumber.
    """
    orders_ref = db.collection("orders")
    query = orders_ref.where("status", "==", "confirmed").order_by("createdAt")
    docs = query.stream()

    ready = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        # Only include orders without tracking numbers
        if not data.get("trackingNumber"):
            ready.append(data)
    return ready


def get_order_by_id(order_id: str) -> dict | None:
    """جلب طلب واحد بالـ ID."""
    doc = db.collection("orders").document(order_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["id"] = doc.id
    return data


def update_order_tracking(order_id: str, tracking_number: str, provider: str = "egypt_post"):
    """
    تحديث الطلب برقم الشحنة بعد نجاح التسجيل.
    يغيّر الحالة تلقائياً إلى "shipping".
    """
    db.collection("orders").document(order_id).update({
        "trackingNumber": tracking_number,
        "shippingProvider": provider,
        "status": "shipping",
        "shippedAt": SERVER_TIMESTAMP,
        "shippingError": firestore.DELETE_FIELD,  # مسح أي خطأ سابق
    })
    log(f"   ✅ Firestore updated: tracking={tracking_number}, status=shipping")


def set_order_error(order_id: str, error_msg: str):
    """تسجيل خطأ شحن على الطلب (يظهر في لوحة التحكم)."""
    db.collection("orders").document(order_id).update({
        "shippingError": error_msg,
    })
    log(f"   ⚠️ Firestore error saved: {error_msg[:80]}")


def send_telegram_notification(tracking_number: str, order: dict):
    """
    إرسال إشعار تيليجرام برقم الشحنة (اختياري).
    يستخدم نفس البوت الموجود في الموقع.
    """
    from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return

    import urllib.request
    import urllib.parse
    import json

    items_text = "\n".join([
        f"  • {item.get('productName', '?')} x{item.get('quantity', 1)}"
        for item in order.get("items", [])
    ])

    message = (
        f"📦 *تم تسجيل شحنة جديدة*\n\n"
        f"🔢 رقم الطلب: `#{order['id'][:8].upper()}`\n"
        f"👤 العميل: {order.get('customerName', '?')}\n"
        f"📍 المحافظة: {order.get('governorate', '?')}\n"
        f"📱 الهاتف: `{order.get('phone', '?')}`\n"
        f"💵 المبلغ: {order.get('total', 0)} ج.م\n\n"
        f"🛍️ المنتجات:\n{items_text}\n\n"
        f"🏷️ رقم البوليصة: `{tracking_number}`\n"
        f"🚚 الشركة: بريد مصر (وصّلها)"
    )

    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        data = urllib.parse.urlencode({
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "Markdown",
        }).encode()
        req = urllib.request.Request(url, data=data)
        urllib.request.urlopen(req, timeout=10)
        log(f"   📱 Telegram notification sent")
    except Exception as e:
        log(f"   ⚠️ Telegram notification failed: {e}")
