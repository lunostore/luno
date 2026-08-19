"""
🚀 Luno Store — Shipping Automation Bot (Egypt Post / Wassalha)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Automates shipment creation on wassalha.egyptpost.org for confirmed orders.

Usage:
  python main.py                       → Process all ready orders
  python main.py --order ORDER_ID      → Process a single order by Firestore ID
  python main.py --watch               → Watch mode (continuous monitoring)
  python main.py --watch --interval 120 → Watch every 2 minutes

Prerequisites:
  1. pip install -r requirements.txt
  2. playwright install chromium
  3. Copy .env.example → .env and fill in credentials
  4. Place your Firebase service-account.json in this directory
"""
import sys
import time
import argparse
from logger import log


def preflight_check():
    """Validate all required config before importing heavy modules."""
    from config import validate_config
    valid, config_errors = validate_config()
    if not valid:
        log("=" * 60)
        log("⚠️ تنبيه: ينقصك إضافة إعدادات البوت بشكل صحيح:")
        for err in config_errors:
            log(f"   ❌ {err}")
        log("💡 يرجى الذهاب لـ GitHub Repository Settings -> Secrets and variables -> Actions وإضافة الأسرار التالية:")
        log("   1. SHIPPING_USERNAME (اسم المستخدم لحساب وصّلها)")
        log("   2. SHIPPING_PASSWORD (كلمة المرور لحساب وصّلها)")
        log("   3. FIREBASE_SERVICE_ACCOUNT_JSON (محتوى ملف service-account.json كاملاً)")
        log("=" * 60)
        sys.exit(1)


def process_orders(order_ids: list[str] | None = None):
    """Process all ready orders or specific order IDs."""
    from firebase_client import get_ready_orders, get_order_by_id, update_order_tracking, set_order_error, send_telegram_notification
    from shipping_bot import ShippingBot

    # ── Fetch orders ──
    if order_ids:
        orders = []
        for oid in order_ids:
            order = get_order_by_id(oid)
            if order:
                orders.append(order)
            else:
                log(f"⚠️ Order not found: {oid}")
    else:
        orders = get_ready_orders()

    if not orders:
        log("✅ لا يوجد طلبات جاهزة للشحن حالياً")
        return {"processed": 0, "success": 0, "failed": 0}

    log(f"📦 تم العثور على {len(orders)} طلب جاهز للشحن")
    log("━" * 50)

    # ── Start bot ──
    bot = ShippingBot()
    stats = {"processed": 0, "success": 0, "failed": 0}

    try:
        bot.start()

        if not bot.login():
            log("❌ فشل تسجيل الدخول لموقع وصّلها (بريد مصر)!")
            log("💡 تأكد من بيانات الدخول في ملف .env")
            return stats

        log("✅ تم تسجيل الدخول بنجاح لـ Wassalha")
        log("━" * 50)

        for i, order in enumerate(orders, 1):
            order_id = order["id"]
            short_id = order_id[:8].upper()

            log(f"\n── [{i}/{len(orders)}] الطلب #{short_id} ──")
            log(f"   👤 العميل: {order.get('customerName', '?')}")
            log(f"   📍 المحافظة: {order.get('governorate', '?')} - {order.get('city', '?')}")
            log(f"   📱 الهاتف: {order.get('phone', '?')}")
            log(f"   💵 المبلغ: {order.get('total', 0)} ج.م")

            stats["processed"] += 1

            try:
                tracking = bot.create_shipment(order)

                if tracking:
                    # ── Success: Update Firestore ──
                    update_order_tracking(order_id, tracking, "egypt_post")
                    stats["success"] += 1
                    log(f"   🎉 نجاح! رقم التتبع: {tracking}")

                    # ── Send Telegram notification ──
                    send_telegram_notification(tracking, order)
                else:
                    # ── No tracking extracted ──
                    error_msg = "لم يتم استخراج رقم التتبع تلقائياً — راجع اللوحة وأدخله يدوياً"
                    set_order_error(order_id, error_msg)
                    stats["failed"] += 1
                    log(f"   ⚠️ {error_msg}")

            except Exception as e:
                # ── Error: Log to Firestore ──
                error_msg = f"خطأ في الأتمتة: {str(e)[:200]}"
                set_order_error(order_id, error_msg)
                stats["failed"] += 1
                log(f"   ❌ {error_msg}")

            # Small delay between orders to avoid being blocked
            if i < len(orders):
                log("   ⏳ انتظار 3 ثواني...")
                time.sleep(3)

    except KeyboardInterrupt:
        log("\n🛑 تم إيقاف العملية بواسطة المستخدم")
    finally:
        bot.stop()

    # ── Summary ──
    log("\n" + "━" * 50)
    log(f"📊 ملخص العملية:")
    log(f"   📦 إجمالي الطلبات: {stats['processed']}")
    log(f"   ✅ نجحت: {stats['success']}")
    log(f"   ❌ فشلت: {stats['failed']}")
    log("━" * 50)

    return stats


def watch_mode(interval: int = 60):
    """
    Continuous monitoring mode.
    Checks for new ready orders every `interval` seconds.
    Press Ctrl+C to stop.
    """
    log(f"👁️ وضع المراقبة — فحص كل {interval} ثانية")
    log(f"   اضغط Ctrl+C للإيقاف")
    log("━" * 50)

    cycle = 0
    while True:
        try:
            cycle += 1
            log(f"\n🔄 دورة #{cycle} — {time.strftime('%H:%M:%S')}")
            result = process_orders()

            if result["success"] > 0:
                log(f"   🎉 تم شحن {result['success']} طلب بنجاح في هذه الدورة!")

            log(f"   ⏳ الدورة القادمة بعد {interval} ثانية...")
            time.sleep(interval)

        except KeyboardInterrupt:
            log("\n🛑 تم إيقاف وضع المراقبة")
            break
        except Exception as e:
            log(f"   ❌ خطأ في الدورة: {e}")
            log(f"   ⏳ إعادة المحاولة بعد {interval} ثانية...")
            time.sleep(interval)


def main():
    """Main entry point with CLI argument parsing."""
    parser = argparse.ArgumentParser(
        description="🚀 Luno Store — Shipping Automation Bot (Egypt Post / Wassalha)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py                         # Process all confirmed orders
  python main.py --order ABC123DEF       # Process specific order
  python main.py --watch                 # Watch mode (check every 60s)
  python main.py --watch --interval 120  # Watch mode (check every 2 min)
        """
    )
    parser.add_argument(
        "--order",
        type=str,
        help="Process a specific order by its Firestore document ID"
    )
    parser.add_argument(
        "--watch",
        action="store_true",
        help="Enable continuous monitoring mode"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=60,
        help="Seconds between checks in watch mode (default: 60)"
    )

    args = parser.parse_args()

    # Preflight validation
    preflight_check()

    # Header
    log("🚀 Luno Store — Shipping Automation Bot")
    log(f"   Target: Wassalha (Egypt Post)")
    log(f"   Mode: {'Watch' if args.watch else 'Single run'}")
    log("━" * 50)

    if args.watch:
        watch_mode(args.interval)
    elif args.order:
        process_orders([args.order])
    else:
        process_orders()


if __name__ == "__main__":
    main()
