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
    const rawChatId = customChatId || siteSettings?.telegramChatId || process.env.TELEGRAM_CHAT_ID;

    if (!token || !rawChatId) {
      return NextResponse.json(
        { error: "بيانات بوت التلجرام غير مكتملة (يرجى إدخال Bot Token و Chat ID بالأدمن)" },
        { status: 400 }
      );
    }

    // Split multiple Chat IDs by comma, semicolon, or newline
    const chatIds = String(rawChatId)
      .split(/[,;\n]+/)
      .map((id) => id.trim())
      .filter(Boolean);

    if (chatIds.length === 0) {
      return NextResponse.json({ error: "لم يتم العثور على أي Chat ID صحيح" }, { status: 400 });
    }

    // Helper to send message to a single Telegram Chat ID
    const sendTelegramMessage = async (id: string, text: string) => {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: id,
          text: text,
          parse_mode: "HTML",
        }),
      });
      const data = await res.json();
      return { id, ok: data.ok, description: data.description, result: data.result };
    };

    // Handle Test Message Trigger
    if (isTest) {
      const testText = `<b>🧪 اختبار اتصال بوت تلجرام LUNO Store</b>
━━━━━━━━━━━━━━━━━━
✅ البوت يعمل بنجاح ومستعد لاستقبال التنبيهات المباشرة للطلبات الجديدة!
👥 عدد المستلمين المحددين: ${chatIds.length} مستلم
⏰ <i>الوقت: ${new Date().toLocaleString("ar-EG")}</i>`;

      const results = await Promise.allSettled(
        chatIds.map((id) => sendTelegramMessage(id, testText))
      );

      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.ok
      );

      if (successful.length === 0) {
        const firstError = results.find((r) => r.status === "fulfilled" && !r.value.ok);
        const errorDesc =
          firstError && firstError.status === "fulfilled"
            ? firstError.value.description
            : "خطأ غير معروف";
        return NextResponse.json(
          { error: `فشل الاتصال بتلجرام لكل الحسابات: ${errorDesc}` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `تم إرسال رسالة الاختبار بنجاح إلى ${successful.length} من أصل ${chatIds.length} مستلم!`,
      });
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

    // Send order notification to ALL Chat IDs simultaneously
    const results = await Promise.allSettled(
      chatIds.map((id) => sendTelegramMessage(id, orderText))
    );

    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value.ok
    ).length;

    return NextResponse.json({
      success: true,
      recipientsCount: chatIds.length,
      deliveredCount: successCount,
    });
  } catch (err: any) {
    console.error("Telegram Notification Exception:", err);
    return NextResponse.json({ error: err.message || "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
