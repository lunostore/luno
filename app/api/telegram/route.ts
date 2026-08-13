import { NextResponse } from "next/server";
import { getSiteSettings, getOrderById } from "@/lib/firebase/firestore";
import { PAYMENT_METHOD_LABELS } from "@/types/order";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { isTest, orderId, botToken: customBotToken, chatId: customChatId } = body;

    // Fetch site settings for bot credentials if not provided directly
    const siteSettings = await getSiteSettings();
    const token = customBotToken || siteSettings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = customChatId || siteSettings?.telegramChatId || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json(
        { error: "بيانات بوت التلجرام غير مكتملة (يرجى إدخال Bot Token و Chat ID بالأدمن)" },
        { status: 400 }
      );
    }

    // Handle Test Message Trigger
    if (isTest) {
      const testText = `<b>🧪 اختبار اتصال بوت تلجرام LUNO Store</b>
━━━━━━━━━━━━━━━━━━
✅ البوت يعمل بنجاح ومستعد لاستقبال التنبيهات المباشرة للطلبات الجديدة!
⏰ <i>الوقت: ${new Date().toLocaleString("ar-EG")}</i>`;

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: testText,
          parse_mode: "HTML",
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        return NextResponse.json(
          { error: `فشل الاتصال بتلجرام: ${data.description || "خطأ غير معروف"}` },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, message: "تم إرسال رسالة الاختبار بنجاح!" });
    }

    // Handle New Order Notification
    if (!orderId) {
      return NextResponse.json({ error: "orderId مطلوب لإرسال الإشعار" }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    const itemsText = order.items
      .map(
        (item, idx) =>
          `  ${idx + 1}. <b>${item.productName}</b>\n     ▫️ اللون: ${item.selectedColor?.name || "عام"} | المقاس: ${item.selectedSize} | الكمية: ${item.quantity} | السعر: ${item.price} ج.م`
      )
      .join("\n");

    const paymentLabel = PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod;
    const shortId = order.id.slice(0, 8).toUpperCase();

    const orderText = `<b>🛍️ طلب جديد في LUNO Store (#${shortId})</b>
━━━━━━━━━━━━━━━━━━
👤 <b>اسم العميل:</b> <code>${order.customerName}</code>
📱 <b>الهاتف الأول:</b> <code>${order.phone}</code>
📞 <b>الهاتف الثاني:</b> <code>${order.secondaryPhone || "غير مدخل"}</code>
📍 <b>المحافظة:</b> ${order.governorate || "غير محددة"}
🏙️ <b>المنطقة/الحي:</b> ${order.city}
🏠 <b>العنوان بالتفصيل:</b> ${order.address}

🛍️ <b>المنتجات المطلوبة:</b>
${itemsText}

💵 <b>المبلغ المطلوب تحصيله:</b> <b>${order.total} ج.م</b> (شامل الشحن)
💳 <b>طريقة الدفع:</b> ${paymentLabel}
${order.transferPhone ? `📱 <b>رقم التحويل:</b> <code>${order.transferPhone}</code>\n` : ""}📝 <b>الملاحظات:</b> ${order.notes || "لا يوجد"}
━━━━━━━━━━━━━━━━━━
⏰ <i>تاريخ الطلب: ${new Date().toLocaleString("ar-EG")}</i>`;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: orderText,
        parse_mode: "HTML",
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("Telegram API Error:", data);
      return NextResponse.json(
        { error: `فشل إرسال الإشعار لتلجرام: ${data.description || "خطأ غير معروف"}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, messageId: data.result?.message_id });
  } catch (err: any) {
    console.error("Telegram Notification Exception:", err);
    return NextResponse.json({ error: err.message || "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
