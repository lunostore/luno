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
- **الإجابة اللحظية عن استفسارات الشحن والخامات**: بناءً على البيانات الحية للمتجر ومافظات مصر.

---

## 2. المعمارية التقنية وتدوير النماذج (AI Models Fallback Engine)

يعتمد الشات بوت على استراتيجية **التدوير الذكي التلقائي (Model Failover Architecture)** بدءاً من **Gemini** أولاً ثم **Groq** كبديل احتياطي لضمان استمرارية الخدمة بنسبة 100%:

```
[User Request] ➔ [CORS & History Trimmer]
                       │
                       ▼
       ┌───────────────────────────────┐
       │   1. Google Gemini Primary    │
       │   - gemini-2.0-flash          │
       │   - gemini-2.0-flash-lite     │
       │   - gemini-2.5-flash          │
       └───────────────┬───────────────┘
                       │ (إذا فشل أو انتهى الحد)
                       ▼
       ┌───────────────────────────────┐
       │   2. Groq AI Models Fallback  │
       │   - llama-3.3-70b-versatile   │
       │   - llama-3.3-70b-specdec     │
       │   - llama-3.1-8b-instant      │
       └───────────────┬───────────────┘
                       │
                       ▼
     [Interactive JSON Response + UI Cards]
```

---

## 3. الربط بقاعدة البيانات وسياسة الأمان (Security & Data Access)

يقرأ الخادم بيانات المتجر لحظياً قبل كل رد لبناء السياق الحي (Live Store Context) من مشروع Firebase `luno-629e0`:

### ✅ البيانات المتاح قراءتها للشات بوت:
- **المنتجات (`products`)**: الأسعار، الخصومات، الخامات، القصات (Fit)، جدول المقاسات، المخزون المتاح بكل لون ومقاس.
- **الأقسام (`categories`)**: قائمة أسماء الأقسام والتصنيفات.
- **أسعار الشحن (`site_settings/shipping`)**: أسعار توصيل المحافظات المحدثة.
- **معلومات المتجر (`site_settings/general`)**: وسائل الدفع المتاحة (فودافون كاش، انستا باي، COD، دفع إلكتروني) وهواتف التواصل.

---

## 5. كود الخادم الرئيسي (Server API Code & Val Town Script)

### ب) كود Val Town الخارجي السيرفرليس (`web.val.run`)

رابط الخدمة الحية: `https://luno--d775de94945311f1a7231607ee4eb77e.web.val.run/`

```typescript
function parseFirestoreField(field: any): any {
  if (!field) return undefined;
  if ("stringValue" in field) return field.stringValue;
  if ("integerValue" in field) return Number(field.integerValue);
  if ("doubleValue" in field) return Number(field.doubleValue);
  if ("booleanValue" in field) return field.booleanValue;
  if ("arrayValue" in field) {
    const vals = field.arrayValue?.values || [];
    return vals.map(parseFirestoreField);
  }
  if ("mapValue" in field) {
    const fields = field.mapValue?.fields || {};
    const res: Record<string, any> = {};
    for (const key of Object.keys(fields)) {
      res[key] = parseFirestoreField(fields[key]);
    }
    return res;
  }
  return undefined;
}

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
        hasGemini ? "موجود ✅ (الأساسي)" : "غير موجود ❌"
      }\n- GROQ_API_KEY / GROK_API_KEY: ${
        hasGroq ? "موجود ✅ (الاحتياطي)" : "غير موجود ❌"
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
    const firebaseProjectId = Deno.env.get("FIREBASE_PROJECT_ID") || "luno-629e0";

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
              const docId = d.name.split("/").pop();
              const fields = d.fields || {};
              const product: any = {};
              for (const k of Object.keys(fields)) {
                product[k] = parseFirestoreField(fields[k]);
              }
              product.id = docId;

              const priceStr = product.salePrice && product.salePrice < product.price 
                ? `${product.salePrice} ج.م (خصم من ${product.price} ج.م)` 
                : `${product.price || 0} ج.م`;

              const colors = product.variants?.map((v: any) => v.colorName).join("، ") || "ألوان عامة";

              return `• منتج: ${product.name}\n  - المعرف (ID): ${product.id}\n  - السعر: ${priceStr}\n  - الألوان المتاحة: ${colors}\n  - الخامة: ${product.material || "قطن 100%"}\n  - القصة: ${product.fit || "Oversized"}\n  - الرابط: /products?id=${product.id}\n  - الوصف: ${product.description || ""}`;
            })
            .join("\n\n");
        }
      }
    } catch (err) {
      console.error(err);
    }

    const systemContext = `أنت الخبير والمساعد الذكي الرسمي لزيادة المبيعات في متجر "LUNO Store" لملابس الموضة والأزياء الراقية.
تحدث باللغة العربية الفصحى البسيطة والواضحة بطريقة ودودة، احترافية، تسويقية جذابة ومساعدة جداً للعملاء.

قواعد مهمة جداً لضمان جودة الرد واللغة العربية الصافية:
1. يمنع منعاً باتاً كلياً استخدام أي حروف أو كلمات باللغة الكورية أو الصينية أو أي لغة غير عربية. تحدث باللغة العربية الفصحى الواضحة والودودة فقط!
2. عند ترشيح أي منتج يناسب العميل، ارفق دائماً التاج الخاص بكارت المنتج التفاعلي في ردك بهذا الشكل بالضبط:
   [PRODUCT_CARD:id=PRODUCT_ID:color=اسم_اللون:size=المقاس]
   مثال: [PRODUCT_CARD:id=prod123:color=أسود:size=L]

3. اكتب أيضاً رابط المنتج التقليدي /products?id=PRODUCT_ID كإغلاق تسويقي.

4. البيع المتقاطع والإغلاق الذكي (Sales Closing):
   - اقترح دائماً لونا يناسب ذوق العميل أو مقاساً متوفر بالمخزون بناءً على بيانات المنتجات أدناه.
   - في نهاية ردك، يمكنك وضع اقتراحين أو 3 أسئلة سريعة يمكن للعميل الضغط عليها بهذا التنسيق:
   [SUGGESTIONS:أضف هذا المنتج للسلة الآن|ما هي خامة هذا المنتج؟|ما هي مصاريف الشحن لـ القاهرة؟]

5. يمنع منعاً باتاً الإفصاح عن أي معلومات حساسة أو طلبات عملاء آخرين.
6. اجعل إجاباتك مختصرة، مشوقة، ومريحة للقارئ.

بيانات المتجر والمعلومات المتاحة لحظياً من قاعدة البيانات:
وسائل الدفع: فودافون كاش، انستا باي، الدفع عند الاستلام (COD)، ودفع إلكتروني.
مصاريف الشحن: القاهرة والجيزة 50 ج.م، باقي المحافظات بين 55 إلى 95 ج.م.

كتالوج المنتجات والخصومات الحالية:
${productsSummary}`;

    const trimmedMessages = messages.slice(-8);

    // ── 1. Gemini AI Models Primary (الأساسي الأول) ──
    if (geminiKey) {
      const geminiModels = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash"];
      for (const model of geminiModels) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemContext }] },
              contents: trimmedMessages.map((m: any) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
              generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const botText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (botText) return new Response(JSON.stringify({ reply: botText, text: botText, provider: `Gemini (${model})` }), { headers: { "Access-Control-Allow-Origin": "*" } });
          }
        } catch (geminiErr) {
          console.error(geminiErr);
        }
      }
    }

    // ── 2. Groq AI Models Fallback (الاحتياطي الثاني) ──
    if (groqKey) {
      const groqModels = ["llama-3.3-70b-versatile", "llama-3.3-70b-specdec", "llama-3.1-8b-instant"];
      for (const model of groqModels) {
        try {
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
            body: JSON.stringify({
              model,
              messages: [{ role: "system", content: systemContext }, ...trimmedMessages],
              temperature: 0.7,
              max_tokens: 800,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const botText = data.choices?.[0]?.message?.content;
            if (botText) return new Response(JSON.stringify({ reply: botText, text: botText, provider: `Groq (${model})` }), { headers: { "Access-Control-Allow-Origin": "*" } });
          }
        } catch (groqErr) {
          console.error(groqErr);
        }
      }
    }

    return new Response(JSON.stringify({ reply: "عذراً الخادم يواجه ضغطاً حالياً." }), { headers: { "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { headers: { "Access-Control-Allow-Origin": "*" } });
  }
}
```
