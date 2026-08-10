# دليل وتقرير شات بوت الذكاء الاصطناعي التفاعلي 🤖🛒 (LUNO AI Chatbot Report)

يقدم هذا المستند توثيقاً شاملاً ومعمارية كاملة لنظام **المساعد الذكي (LUNO Chat AI)** المطور خصيصاً لمتجر **LUNO Store** لملابس الموضة والأزياء الراقية، بهدف زيادة المبيعات ومساعدة العملاء تفاعلياً وإتاحة الشراء بضغطة زر واحدة من داخل الشات.

---

## 📑 فهرس المحتويات
1. [نظرة عامة والهدف التجاري](#1-نظرة-عامة-والهدف-التجاري)
2. [المعمارية التقنية وتدوير النماذج (AI Models Fallback Engine)](#2-المعمارية-التقنية-وتدوير-النماذج-ai-models-fallback-engine)
3. [الربط بقاعدة البيانات وسياسة الأمان (Security & Data Access)](#3-الربط-بقاعدة-البيانات-وسياسة-الأمان-security--data-access)
4. [ميزات زيادة المبيعات والتفاعل (Sales & Conversion Features)](#4-ميزات-زيادة-المبيعات-والتفاعل-sales--conversion-features)
5. [كود الخادم الرئيسي (Server API Code & Val Town Script)](#5-كود-الخادم-الرئيسي-server-api-code--val-town-script)
6. [مكونات الواجهة التفاعلية (Frontend Chat Engine)](#6-مكونات-الواجهة-التفاعلية-frontend-chat-engine)
7. [لوحة تحليلات الأدمن وتتبع المبيعات (Admin AI Analytics)](#7-لوحة-تحليلات-الأدمن-وتتبع-المبيعات-admin-ai-analytics)
8. [دليل المتغيرات والرفع (Deployment & Environment Variables)](#8-دليل-المتغيرات-والرفع-deployment--environment-variables)

---

## 1. نظرة عامة والهدف التجاري

تم تصميم **LUNO Chat AI** ليعمل كمساعد مبيعات خبير واحترافي يرافق زوار المتجر في رحلة الشراء. يهدف الشات بوت إلى:
- **تحويل الزوار إلى مشتريين (Sales Conversion Rate)** عبر ترشيح القطع الأكثر مناسبة لذوقهم واحتياجاتهم.
- **توفير تجربة تسوق فورية**: اختيار المقاس واللون والإضافة لسلة المشتريات دون الحاجة للانتقال بين الصفحات.
- **الإجابة اللحظية عن استفسارات الشحن والخامات**: بناءً على البيانات الحية للمتجر ومحافظات مصر.

---

## 2. المعمارية التقنية وتدوير النماذج (AI Models Fallback Engine)

يعتمد الشات بوت على استراتيجية **التدوير الذكي التلقائي (Model Failover Architecture)** لضمان استمرارية الخدمة بنسبة 100% وتفادي قيود الـ Rate Limits والضغط العالي:

```
[User Request] ➔ [CORS & History Trimmer]
                       │
                       ▼
       ┌───────────────────────────────┐
       │   1. Groq AI Models Primary   │
       │   - llama-3.3-70b-versatile   │
       │   - llama-3.3-70b-specdec     │
       │   - llama-3.1-8b-instant      │
       └───────────────┬───────────────┘
                       │ (إذا فشل أو انتهى الحد)
                       ▼
       ┌───────────────────────────────┐
       │   2. Google Gemini Fallback   │
       │   - gemini-2.0-flash          │
       │   - gemini-2.0-flash-lite     │
       │   - gemini-2.5-flash          │
       └───────────────┬───────────────┘
                       │
                       ▼
     [Interactive JSON Response + UI Cards]
```

---

## 3. الربط بقاعدة البيانات وسياسة الأمان (Security & Data Access)

يقرأ الخادم بيانات المتجر لحظياً قبل كل رد لبناء السياق الحي (Live Store Context):

### ✅ البيانات المتاح قراءتها للشات بوت:
- **المنتجات (`products`)**: الأسعار، الخصومات، الخامات، القصات (Fit)، جدول المقاسات، المخزون المتاح بكل لون ومقاس.
- **الأقسام (`categories`)**: قائمة أسماء الأقسام والتصنيفات.
- **أسعار الشحن (`site_settings/shipping`)**: أسعار توصيل المحافظات المحدثة.
- **معلومات المتجر (`site_settings/general`)**: وسائل الدفع المتاحة (فودافون كاش، انستا باي، COD، دفع إلكتروني) وهواتف التواصل.

### 🛡️ سياسة الأمان والخصوصية الخارمة:
- **يُحظر تماماً** وصول الشات بوت لسجل الطلبات (`orders`) أو الرسائل أو بيانات العملاء الشخصية، لحماية خصوصية بيانات المستخدمين بنسبة 100%.

---

## 4. ميزات زيادة المبيعات والتفاعل (Sales & Conversion Features)

1. **كروت المنتجات التفاعلية داخل المحادثة (`InChatProductCard`)**:
   - عرض صور القطعة الموصى بها، السعر الأصلي، سعر الخصم.
   - أزرار تفاعلية اختيار الألوان والمقاسات المتاحة بالمخزون.
   - **زر إضافة للسلة بضغطة واحدة (1-Click Add-to-Cart)**.
2. **روابط المنتجات المباشرة**:
   - تحويل روابط `/products?id=PRODUCT_ID` تلقائياً إلى أزرار تفاعلية **"عرض المنتج"** لتسريع المعاينة.
3. **أزرار الرد السريع السلسة (`Follow-up Suggestion Chips`)**:
   - استخراج تاجات `[SUGGESTIONS:سؤال 1|سؤال 2]` وعرضها كفقاعات تفاعلية أسفل رسائل الشات بوت.

---

## 5. كود الخادم الرئيسي (Server API Code & Val Town Script)

### أ) كود المسار المحلي في المشروع (`app/api/chat/route.ts`)

```typescript
import { NextResponse } from "next/server";
import { getProducts, getCategories, getShippingRates, getSiteSettings } from "@/lib/firebase/firestore";

export const dynamic = "force-static";

interface ChatPayloadMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET() {
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasGroq = !!(process.env.GROQ_API_KEY || process.env.GROK_API_KEY);
  return new Response(
    `حالة مفاتيح AI في LUNO Store:\n- GEMINI_API_KEY: ${
      hasGemini ? "موجود ✅" : "غير موجود ❌"
    }\n- GROQ_API_KEY / GROK_API_KEY: ${
      hasGroq ? "موجود ✅" : "غير موجود ❌"
    }`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body as { messages: ChatPayloadMessage[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "صيغة الرسائل غير صحيحة" }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let productsSummary = "لا توجد منتجات مسجلة حالياً.";
    let categoriesSummary = "";
    let shippingSummary = "";
    let storeSettingsSummary = "";

    try {
      const [products, categories, shippingRates, siteSettings] = await Promise.all([
        getProducts(),
        getCategories(),
        getShippingRates(),
        getSiteSettings(),
      ]);

      if (products && products.length > 0) {
        productsSummary = products
          .map((p) => {
            const priceText =
              p.salePrice && p.salePrice < p.price
                ? `${p.salePrice} ج.م (خصم من ${p.price} ج.م)`
                : `${p.price} ج.م`;

            const colorsAndSizes =
              p.variants
                ?.map((v) => {
                  const sizesStock = v.sizes
                    .map((s) => `${s.size} (${s.stock > 0 ? `متوفر ${s.stock} قطعة` : "غير متوفر"})`)
                    .join(", ");
                  return `لون ${v.colorName}: [${sizesStock}]`;
                })
                .join(" | ") || "ألوان/مقاسات عامة";

            return `• منتج: ${p.name}
  - المعرف (ID): ${p.id}
  - السعر: ${priceText}
  - القسم: ${p.category || "عام"}
  - الخامة: ${p.material || "خامة فاخرة 100% قطن"}
  - القصة/الفيت: ${p.fit || "قصة عادية / Oversized"}
  - الألوان والمقاسات المتاحة: ${colorsAndSizes}
  - الرابط المباشر للمنتج: /products?id=${p.id}
  - الوصف التفصيلي: ${p.description || "لا يوجد وصف إضافي"}`;
          })
          .join("\n\n");
      }

      if (categories && categories.length > 0) {
        categoriesSummary = categories.map((c) => c.name).join("، ");
      }

      if (shippingRates && shippingRates.length > 0) {
        shippingSummary = shippingRates
          .filter((r) => r.active)
          .map((r) => `${r.nameAr}: ${r.price} ج.م`)
          .join("، ");
      }

      if (siteSettings) {
        storeSettingsSummary = `
- اسم المتجر: ${siteSettings.storeName || "LUNO Store"}
- وسائل الدفع المتاحة: الدفع عند الاستلام (COD)، فودافون كاش (${siteSettings.vodafoneCash || "متوفر"})، انستا باي (${siteSettings.instapayUsername || "متوفر"})، والدفع الإلكتروني الأونلاين.
- وسائل التواصل: ${siteSettings.storePhone ? `تلفون: ${siteSettings.storePhone}` : ""} ${siteSettings.storeEmail ? `إيميل: ${siteSettings.storeEmail}` : ""}`;
      }
    } catch (dbErr) {
      console.error("Failed to fetch live context for chatbot:", dbErr);
    }

    const systemContext = `أنت الخبير والمساعد الذكي الرسمي لزيادة المبيعات في متجر "LUNO Store" لملابس الموضة والأزياء الراقية.
تحدث باللغة العربية بطريقة ودودة، احترافية، تسويقية جذابة ومساعدة جداً للعملاء.

قواعد مهمة جداً لإجابات الشات بوت وتوليد المبيعات:
1. عند ترشيح أي منتج يناسب العميل، ارفق دائماً التاج الخاص بكارت المنتج التفاعلي في ردك بهذا الشكل بالضبط:
   [PRODUCT_CARD:id=PRODUCT_ID:color=اسم_اللون:size=المقاس]
   مثال: [PRODUCT_CARD:id=prod123:color=أسود:size=L]

2. اكتب أيضاً رابط المنتج التقليدي /products?id=PRODUCT_ID كإغلاق تسويقي.

3. البيع المتقاطع والإغلاق الذكي (Sales Closing):
   - اقترح دائماً لونا يناسب ذوق العميل أو مقاساً متوفر بالمخزون بناءً على بيانات المنتجات أدناه.
   - في نهاية ردك، يمكنك وضع اقتراحين أو 3 أسئلة سريعة يمكن للعميل الضغط عليها بهذا التنسيق:
   [SUGGESTIONS:أضف هذا المنتج للسلة الآن|ما هي خامة هذا المنتج؟|ما هي مصاريف الشحن لـ القاهرة؟]

4. يمنع منعاً باتاً الإفصاح عن أي معلومات حساسة أو طلبات عملاء آخرين.
5. اجعل إجاباتك مختصرة، مشوقة، ومريحة للقارئ.

بيانات المتجر والمعلومات المتاحة لحظياً من قاعدة البيانات:
${storeSettingsSummary}

أقسام المتجر المتاحة:
${categoriesSummary || "ملابس عصرية رجالي وحريمي وأوفر سايز"}

أسعار الشحن للمحافظات:
${shippingSummary || "القاهرة والجيزة: 50 ج.م، باقي المحافظات بين 55 إلى 95 ج.م"}

كتالوج المنتجات والخصومات الحالية:
${productsSummary}`;

    const trimmedMessages = messages.slice(-8);

    // ── 1. Groq Model Rotation ──
    if (groqKey) {
      const groqModels = ["llama-3.3-70b-versatile", "llama-3.3-70b-specdec", "llama-3.1-8b-instant"];
      for (const model of groqModels) {
        try {
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemContext },
                ...trimmedMessages.map((m) => ({
                  role: m.role === "user" ? "user" : "assistant",
                  content: m.content,
                })),
              ],
              temperature: 0.7,
              max_tokens: 800,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const botText = data.choices?.[0]?.message?.content;
            if (botText) {
              return NextResponse.json(
                { reply: botText, text: botText, message: botText, provider: `Groq (${model})` },
                { headers: { "Access-Control-Allow-Origin": "*" } }
              );
            }
          }
        } catch (groqErr) {
          console.error(`Groq [${model}] fetch failed:`, groqErr);
        }
      }
    }

    // ── 2. Gemini Fallback Rotation ──
    if (geminiKey) {
      const geminiModels = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash"];
      for (const model of geminiModels) {
        try {
          let geminiContents = trimmedMessages.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          }));

          while (geminiContents.length > 0 && geminiContents[0].role !== "user") {
            geminiContents = geminiContents.slice(1);
          }

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemContext }] },
                contents: geminiContents,
                generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const botText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (botText) {
              return NextResponse.json(
                { reply: botText, text: botText, message: botText, provider: `Gemini (${model})` },
                { headers: { "Access-Control-Allow-Origin": "*" } }
              );
            }
          }
        } catch (geminiErr) {
          console.error(`Gemini [${model}] fetch failed:`, geminiErr);
        }
      }
    }

    return NextResponse.json({
      reply: "عذراً، الخادم يواجه ضغطاً كبيراً حالياً. يرجى المحاولة بعد قليل. 🌸",
      text: "عذراً، الخادم يواجه ضغطاً كبيراً حالياً.",
    });
  } catch (err: unknown) {
    return NextResponse.json({ reply: "عذراً، حدث خطأ غير متوقع في الخادم." });
  }
}
```

---

### ب) كود Val Town الخارجي السيرفرليس (`web.val.run`)

رابط الخدمة الحية: `https://luno--d775de94945311f1a7231607ee4eb77e.web.val.run/`

```typescript
export default async function (req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method === "GET") {
    const hasGemini = !!Deno.env.get("GEMINI_API_KEY");
    const hasGroq = !!(Deno.env.get("GROQ_API_KEY") || Deno.env.get("GROK_API_KEY"));
    return new Response(
      `حالة مفاتيح AI في LUNO Store Val Town:\n- GEMINI_API_KEY: ${
        hasGemini ? "موجود ✅" : "غير موجود ❌"
      }\n- GROQ_API_KEY / GROK_API_KEY: ${
        hasGroq ? "موجود ✅" : "غير موجود ❌"
      }\n\nرابط الـ Web Val الخاص بك هو:\n${req.url}`,
      {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Access-Control-Allow-Origin": "*" },
      }
    );
  }

  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  try {
    const body = await req.json();
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const groqKey = Deno.env.get("GROQ_API_KEY") || Deno.env.get("GROK_API_KEY");
    const firebaseProjectId = Deno.env.get("FIREBASE_PROJECT_ID") || "lunostore-4d2d4";

    const { messages } = body;
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "صيغة الرسائل غير صحيحة" }), { status: 400 });
    }

    let productsSummary = "لا توجد منتجات مسجلة حالياً.";
    try {
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/products`);
      if (res.ok) {
        const data = await res.json();
        const docs = data.documents || [];
        if (docs.length > 0) {
          productsSummary = docs
            .map((d: any) => {
              const fields = d.fields || {};
              const name = fields.name?.stringValue || "منتج";
              const price = fields.price?.doubleValue || fields.price?.integerValue || 0;
              const salePrice = fields.salePrice?.doubleValue || fields.salePrice?.integerValue;
              const id = d.name.split("/").pop();
              const priceStr = salePrice && salePrice < price ? `${salePrice} ج.م (خصم من ${price} ج.م)` : `${price} ج.م`;
              return `• منتج: ${name}\n  - المعرف (ID): ${id}\n  - السعر: ${priceStr}\n  - الرابط: /products?id=${id}`;
            })
            .join("\n\n");
        }
      }
    } catch (err) {
      console.error(err);
    }

    const systemContext = `أنت المساعد الذكي الرسمي لمتجر LUNO Store. ارفق تاجات كروت المنتجات التفاعلية [PRODUCT_CARD:id=PROD_ID:color=COLOR:size=SIZE] وأزرار المتابعة السريعة [SUGGESTIONS:سؤال1|سؤال2] عند كل إجابة.

كتالوج المنتجات الحالية:
${productsSummary}`;

    const trimmedMessages = messages.slice(-8);

    if (groqKey) {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: systemContext }, ...trimmedMessages],
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const botText = data.choices?.[0]?.message?.content;
        if (botText) return new Response(JSON.stringify({ reply: botText, text: botText }), { headers: { "Access-Control-Allow-Origin": "*" } });
      }
    }

    if (geminiKey) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemContext }] },
          contents: trimmedMessages.map((m: any) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const botText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (botText) return new Response(JSON.stringify({ reply: botText, text: botText }), { headers: { "Access-Control-Allow-Origin": "*" } });
      }
    }

    return new Response(JSON.stringify({ reply: "عذراً الخادم يواجه ضغطاً حالياً." }));
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }));
  }
}
```

---

## 6. مكونات الواجهة التفاعلية (Frontend Chat Engine)

الملف الرئيسي: `components/chat/LUNOChatWidget.tsx`

### مكون كارت المنتج التفاعلي داخل الشات (`InChatProductCard`):
```tsx
function InChatProductCard({ productId, defaultColor, defaultSize }) {
  // يجلب بيانات المنتج لحظياً ويسمح باختيار اللون والمقاس والإضافة للسلة بضغطة زر واحدة
}
```

---

## 7. لوحة تحليلات الأدمن وتتبع المبيعات (Admin AI Analytics)

المسار: `/admin/analytics/chat` ([app/(admin)/admin/analytics/chat/page.tsx](file:///d:/%D8%B4%D8%BA%D9%8لا/lunostore/nxt-main/app/(admin)/admin/analytics/chat/page.tsx))

- **مؤشرات الأداء المباشرة (KPIs)**:
  - إجمالي المحادثات مع الزوار.
  - إجمالي التوصيات الصادرة من الذكاء الاصطناعي.
  - عدد إضافات السلة الناتجة عن الشات.
  - معدل التحويل إلى مبيعات (Conversion Rate %).
  - الإيرادات المقدرة بالجنيه المصري (EGP).
- **قائمة أكثر المنتجات تحويلاً للمبيعات (Top Recommended Items)**.
- **سجل الأحداث المباشر (Realtime Chat Events Log)**.

---

## 8. دليل المتغيرات والرفع (Deployment & Environment Variables)

في ملف الإعدادات أو Vercel / Val Town، أضف المتغيرات التالية:

| اسم المتغير | الوصف | الحالة |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | مفتاح Google Gemini API للذكاء الاصطناعي | مفعل ✅ |
| `GROQ_API_KEY` أو `GROK_API_KEY` | مفتاح Groq Llama 3.3 70B السريع | مفعل ✅ |
| `NEXT_PUBLIC_CHATBOT_API_URL` | رابط الشات بوت (افتراضياً Val Town) | `https://luno--d775de94945311f1a7231607ee4eb77e.web.val.run/` |
