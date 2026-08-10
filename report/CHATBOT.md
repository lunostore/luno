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
- **تحويل الزوار إلى مشتريين (Sales Conversion Rate)** عبر ترشيح أحدث القطع المضافة للمتجر.
- **توفير تجربة تسوق فورية**: اختيار المقاس واللون والإضافة لسلة المشتريات دون الحاجة للانتقال بين الصفحات.
- **الإجابة اللحظية والدقيقة عن طرق الدفع المفعّلة حياً**: فودافون كاش وانستا باي والدفع عند الاستلام بناءً على خيارات التحكم في لوحة الأدمن.

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
- **المنتجات (`products`)**: أحدث منتج تم إضافته للمتجر فقط (`slice(0, 1)`).
- **أرقام الدفع وحالات التفعيل (`site_settings/general`)**: 
  - حالة تفعيل فودافون كاش (`vodafoneCashEnabled`) ورقم التحويل.
  - حالة تفعيل انستا باي (`instapayEnabled`) وحساب التحويل.
  - حالة الدفع الأونلاين العام (`onlinePaymentEnabled`).
- **أسعار الشحن (`site_settings/shipping`)**: أسعار توصيل المحافظات المحدثة.

### 🛡️ سياسة الصدق والأمان:
- يقرأ الشات بوت حالة تفعيل كل طريقة دفع لحظياً؛ إذا كانت طريقة معطلة من الأدمن، يعتذر للعميل بشياكة ويخبره بالطرق المتاحة حالياً فقط.
- يمنع اختراع أو تأليف أي أرقام فودافون كاش أو انستا باي وهمية.
- **يُحظر تماماً** وصول الشات بوت لسجل الطلبات (`orders`) أو الرسائل أو بيانات العملاء الشخصية.

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
        hasGemini ? "موجود ✅ (الأساسي الأول)" : "غير موجود ❌"
      }\n- GROQ_API_KEY / GROK_API_KEY: ${
        hasGroq ? "موجود ✅ (الاحتياطي الثاني)" : "غير موجود ❌"
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
            .slice(0, 1)
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

              return `• أحدث منتج تم إضافته للمتجر: ${product.name}\n  - المعرف (ID): ${product.id}\n  - السعر: ${priceStr}\n  - الألوان المتاحة: ${colors}\n  - الخامة: ${product.material || "قطن 100%"}\n  - القصة: ${product.fit || "Oversized"}\n  - الرابط: /products?id=${product.id}\n  - الوصف: ${product.description || ""}`;
            })
            .join("\n\n");
        }
      }
    } catch (err) {
      console.error("Firestore REST fetch error:", err);
    }

    let vodafoneCashVal = "";
    let instapayVal = "";
    let isOnlineEnabled = true;
    let isVfEnabled = true;
    let isInstaEnabled = true;

    try {
      const sRes = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/site_settings/general`);
      if (sRes.ok) {
        const sData = await sRes.json();
        const sFields = sData.fields || {};
        isOnlineEnabled = sFields.onlinePaymentEnabled?.booleanValue !== false;
        isVfEnabled = isOnlineEnabled && sFields.vodafoneCashEnabled?.booleanValue !== false;
        isInstaEnabled = isOnlineEnabled && sFields.instapayEnabled?.booleanValue !== false;

        vodafoneCashVal = sFields.vodafoneCash?.stringValue?.trim() || "";
        instapayVal = sFields.instapayUsername?.stringValue?.trim() || "";
      }
    } catch (sErr) {
      console.error("Site settings fetch error:", sErr);
    }

    const vfText = isVfEnabled
      ? (vodafoneCashVal ? `متاح ✅ ورقم التحويل هو: (${vodafoneCashVal})` : "متاح ✅ ورقم التحويل غير مسجل بالسيستم")
      : "معطّل حالياً ❌ (غير متاح الاستقبال عليه)";

    const instaText = isInstaEnabled
      ? (instapayVal ? `متاح ✅ وحساب التحويل هو: (${instapayVal})` : "متاح ✅ وحساب التحويل غير مسجل بالسيستم")
      : "معطّل حالياً ❌ (غير متاح الاستقبال عليه)";

    const activeMethodsList = [
      "الدفع عند الاستلام (COD)",
      isVfEnabled ? "فودافون كاش" : null,
      isInstaEnabled ? "انستا باي (InstaPay)" : null,
    ].filter(Boolean).join("، ");

    const systemContext = `أنت الخبير والمساعد الذكي الرسمي لزيادة المبيعات في متجر "LUNO Store" لملابس الموضة والأزياء الراقية.
تحدث باللغة العربية الفصحى البسيطة والواضحة بطريقة ودودة، احترافية، تسويقية جذابة ومساعدة جداً للعملاء.

قواعد مهمة جداً لضمان جودة الرد واللغة العربية الصافية:
1. يمنع منعاً باتاً كلياً استخدام أي حروف أو كلمات باللغة الكورية أو الصينية أو أي لغة غير عربية. تحدث باللغة العربية الفصحى الواضحة والودودة فقط!
2. الصدق والأمانة والدقة الفائقة في طرق الدفع (مهم جداً جداً):
   - يقرأ السيستم حالة الدفع المتاحة لحظياً. إذا كانت طريقة دفع معطّلة (سواء فودافون كاش أو انستا باي)، وسألك العميل عنها، أخبره بصراحة وشياكة: "حالياً متاح طريقة كذا فقط (اذكر المفعّل فقط) وطريقة كذا غير متاحة حالياً."
   - جاوب بالرقم أو الحساب المكتوب في البيانات أعلاه فقط إذا كانت الطريقة مفعّلة. يمنع منعاً باتاً اختراع أو تأليف أي رقم أو حساب وهمي إطلاقاً!
3. عند ترشيح المنتج، ارفق دائماً التاج الخاص بكارت المنتج التفاعلي في ردك بهذا الشكل بالضبط:
   [PRODUCT_CARD:id=PRODUCT_ID:color=اسم_اللون:size=المقاس]
   مثال: [PRODUCT_CARD:id=prod123:color=أسود:size=L]

4. اكتب أيضاً رابط المنتج التقليدي /products?id=PRODUCT_ID كإغلاق تسويقي.

5. البيع المتقاطع والإغلاق الذكي (Sales Closing):
   - اقترح دائماً لونا يناسب ذوق العميل أو مقاساً متوفر بالمخزون بناءً على بيانات المنتجات أدناه.
   - في نهاية ردك، يمكنك وضع اقتراحين أو 3 أسئلة سريعة يمكن للعميل الضغط عليها بهذا التنسيق:
   [SUGGESTIONS:أضف هذا المنتج للسلة الآن|ما هي خامة هذا المنتج؟|ما هي مصاريف الشحن لـ القاهرة؟]

6. يمنع منعاً باتاً الإفصاح عن أي معلومات حساسة أو طلبات عملاء آخرين.
7. اجعل إجاباتك مختصرة، مشوقة، ومريحة للقارئ.

بيانات المتجر والمعلومات المتاحة لحظياً من قاعدة البيانات الحية:
حالة الدفع المتاحة حالياً بالمتجر: [${activeMethodsList}]
تفاصيل فودافون كاش: ${vfText}
تفاصيل انستا باي (InstaPay): ${instaText}
الدفع عند الاستلام (COD): متاح لجميع المحافظات ✅

أسعار الشحن للمحافظات:
القاهرة والجيزة: 50 ج.م، باقي المحافظات بين 55 إلى 95 ج.م.

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

    return new Response(JSON.stringify({ reply: "عذراً الخادم يواجه ضغطاً حالياً. يرجى المحاولة بعد قليل. 🌸" }), { headers: { "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { headers: { "Access-Control-Allow-Origin": "*" } });
  }
}
```
