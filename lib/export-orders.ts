import type { Order } from "@/types/order";
import { PAYMENT_METHOD_LABELS, ORDER_STATUS_LABELS } from "@/types/order";

/**
 * Export orders array to a UTF-8 BOM encoded CSV file compatible with Microsoft Excel.
 */
export function exportOrdersToExcel(orders: Order[], filename = "LUNO_Orders_Report.csv") {
  if (!orders || orders.length === 0) {
    throw new Error("لا توجد طلبات للتصدير");
  }

  const headers = [
    "رقم الطلب",
    "التاريخ",
    "اسم العميل",
    "الهاتف الأول",
    "الهاتف الثاني (البديل)",
    "المحافظة",
    "المنطقة / الحي",
    "العنوان بالتفصيل",
    "تفاصيل المنتجات والكميات",
    "المبلغ الإجمالي (ج.م)",
    "طريقة الدفع",
    "حالة الطلب",
    "الملاحظات",
  ];

  const rows = orders.map((order) => {
    const dateStr =
      order.createdAt instanceof Date
        ? order.createdAt.toLocaleString("ar-EG")
        : (order.createdAt as any)?.toDate
        ? (order.createdAt as any).toDate().toLocaleString("ar-EG")
        : new Date(order.createdAt as any).toLocaleString("ar-EG");

    const itemsSummary = order.items
      .map(
        (i) =>
          `${i.productName} (اللون: ${i.selectedColor?.name || "عام"} | المقاس: ${i.selectedSize} | العدد: ${i.quantity})`
      )
      .join(" - ");

    const paymentText = PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod;
    const statusText = ORDER_STATUS_LABELS[order.status] || order.status;

    return [
      `#${order.id.slice(0, 8).toUpperCase()}`,
      `"${dateStr}"`,
      `"${(order.customerName || "").replace(/"/g, '""')}"`,
      `"${order.phone}"`,
      `"${order.secondaryPhone || "—"}"`,
      `"${(order.governorate || "غير محدد").replace(/"/g, '""')}"`,
      `"${(order.city || "").replace(/"/g, '""')}"`,
      `"${(order.address || "").replace(/"/g, '""')}"`,
      `"${itemsSummary.replace(/"/g, '""')}"`,
      order.total,
      `"${paymentText.replace(/"/g, '""')}"`,
      `"${statusText.replace(/"/g, '""')}"`,
      `"${(order.notes || "—").replace(/"/g, '""')}"`,
    ];
  });

  // UTF-8 BOM prefix (\uFEFF) for Excel compatibility with Arabic Unicode
  const csvContent =
    "\uFEFF" +
    [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open a printable PDF & shipping manifest print layout for selected or all orders.
 */
export function printOrdersPDF(orders: Order[]) {
  if (!orders || orders.length === 0) {
    throw new Error("لا توجد طلبات للطباعة والتصدير");
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("يرجى تفعيل السماح بالنوافذ المنبثقة (Popups) في متصفحك للطباعة");
  }

  const totalAmount = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const dateStr = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const ordersHTML = orders
    .map((order, idx) => {
      const itemsList = order.items
        .map(
          (i) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><b>${i.productName}</b></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${i.selectedColor?.name || "عام"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${i.selectedSize}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${i.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: left;"><b>${i.price * i.quantity} ج.م</b></td>
        </tr>
      `
        )
        .join("");

      return `
      <div style="page-break-inside: avoid; border: 2px solid #18181b; border-radius: 16px; margin-bottom: 24px; padding: 20px; background: #fff;">
        <!-- Card Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f4f4f5; padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <span style="background: #18181b; color: #fff; padding: 4px 10px; border-radius: 8px; font-weight: 900; font-size: 13px;">
              شحنة #${idx + 1}
            </span>
            <span style="font-family: monospace; font-size: 14px; font-weight: bold; margin-right: 8px;">
              #${order.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div style="text-align: left;">
            <span style="font-size: 12px; color: #71717a; font-weight: bold;">
              طريقة الدفع: ${PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
            </span>
          </div>
        </div>

        <!-- Customer & Shipping Info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px; background: #fafafa; padding: 16px; border-radius: 12px; margin-bottom: 16px; border: 1px solid #e4e4e7;">
          <div>
            <p style="margin: 0 0 6px 0; color: #71717a;">👤 <b>اسم العميل:</b> <span style="color: #000; font-size: 14px;">${order.customerName}</span></p>
            <p style="margin: 0 0 6px 0; color: #71717a;">📱 <b>الهاتف الأول:</b> <span style="font-family: monospace; font-weight: bold; color: #000;">${order.phone}</span></p>
            <p style="margin: 0; color: #71717a;">📞 <b>الهاتف الثاني:</b> <span style="font-family: monospace; font-weight: bold; color: #000;">${order.secondaryPhone || "غير مدخل"}</span></p>
          </div>
          <div>
            <p style="margin: 0 0 6px 0; color: #71717a;">📍 <b>المحافظة:</b> <span style="color: #000; font-weight: bold;">${order.governorate || "غير محددة"} (${order.city})</span></p>
            <p style="margin: 0 0 6px 0; color: #71717a;">🏠 <b>العنوان التفصيلي:</b> <span style="color: #000; font-weight: bold;">${order.address}</span></p>
            ${order.notes ? `<p style="margin: 0; color: #c2410c;">📝 <b>ملاحظات:</b> <i>"${order.notes}"</i></p>` : ""}
          </div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px;">
          <thead>
            <tr style="background: #f4f4f5; color: #27272a;">
              <th style="padding: 8px; text-align: right;">المنتج</th>
              <th style="padding: 8px; text-align: center;">اللون</th>
              <th style="padding: 8px; text-align: center;">المقاس</th>
              <th style="padding: 8px; text-align: center;">العدد</th>
              <th style="padding: 8px; text-align: left;">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>

        <!-- Order Total Banner -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #18181b; color: #fff; padding: 12px 16px; border-radius: 12px;">
          <span style="font-size: 13px; font-weight: bold;">💵 المبلغ المطلوب تحصيله من العميل (شامل الشحن):</span>
          <span style="font-size: 18px; font-weight: 900; color: #f59e0b; font-family: monospace;">${order.total} ج.م</span>
        </div>
      </div>
    `;
    })
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>كشوفات فواتير الشحن - LUNO Store</title>
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; padding: 0; margin: 0; }
          .no-print { display: none !important; }
        }
        body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; background: #fff; color: #000; }
      </style>
    </head>
    <body>
      <!-- Print Button Bar -->
      <div class="no-print" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; background: #18181b; color: #fff; padding: 16px 24px; border-radius: 16px;">
        <div>
          <h2 style="margin: 0; font-size: 16px; font-weight: 900;">🖨️ طباعة كشوفات وفواتير الشحنات</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #a1a1aa;">جاهزة للطباعة الحية على الورق أو الحفظ كملف PDF</p>
        </div>
        <button onclick="window.print()" style="background: #f59e0b; color: #000; border: none; padding: 10px 24px; font-weight: 900; border-radius: 12px; cursor: pointer; font-size: 14px;">
          🖨️ بدء الطباعة / حفظ PDF
        </button>
      </div>

      <!-- Report Header -->
      <div style="border-bottom: 3px solid #18181b; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -1px;">LUNO STORE 🛍️</h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #52525b; font-weight: bold;">كشوف الفواتير والشحنات المعتمدة لشركة الشحن</p>
        </div>
        <div style="text-align: left; font-size: 12px; color: #52525b;">
          <p style="margin: 0 0 4px 0;"><b>التاريخ:</b> ${dateStr}</p>
          <p style="margin: 0 0 4px 0;"><b>عدد الشحنات:</b> ${orders.length} شحنة</p>
          <p style="margin: 0;"><b>إجمالي المبالغ المطلوبة:</b> <b style="color: #000; font-size: 15px;">${totalAmount} ج.م</b></p>
        </div>
      </div>

      <!-- Orders List -->
      ${ordersHTML}
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
