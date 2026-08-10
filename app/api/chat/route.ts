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
      hasGemini ? "موجود ✅ (الأساسي)" : "غير موجود ❌"
    }\n- GROQ_API_KEY / GROK_API_KEY: ${
      hasGroq ? "موجود ✅ (الاحتياطي)" : "غير موجود ❌"
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
      return NextResponse.json(
        { error: "صيغة الرسائل غير صحيحة" },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;

    // جلب بيانات المتجر الحية لحظياً من Firestore (بدون صلاحية للطلبات أو بيانات العملاء)
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
        // العرض مقتصر فقط على آخر منتج تم إضافته للمتجر
        productsSummary = products
          .slice(0, 1)
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

            return `• أحدث منتج تم إضافته للمتجر: ${p.name}
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

      const isOnlineEnabled = siteSettings?.onlinePaymentEnabled !== false;
      const isVfEnabled = isOnlineEnabled && siteSettings?.vodafoneCashEnabled !== false;
      const isInstaEnabled = isOnlineEnabled && siteSettings?.instapayEnabled !== false;

      const vfText = isVfEnabled
        ? `متاح ✅ ورقم التحويل هو: (${siteSettings?.vodafoneCash?.trim() || "غير مسجل بالسيستم"})`
        : `معطّل حالياً ❌ (غير متاح الاستقبال عليه)`;

      const instaText = isInstaEnabled
        ? `متاح ✅ وحساب التحويل هو: (${siteSettings?.instapayUsername?.trim() || "غير مسجل بالسيستم"})`
        : `معطّل حالياً ❌ (غير متاح الاستقبال عليه)`;

      const activeMethodsList = [
        "الدفع عند الاستلام (COD)",
        isVfEnabled ? "فودافون كاش" : null,
        isInstaEnabled ? "انستا باي (InstaPay)" : null,
      ].filter(Boolean).join("، ");

      storeSettingsSummary = `
- اسم المتجر: ${siteSettings?.storeName || "LUNO Store"}
- حالة الدفع المتاحة حالياً بالمتجر: [${activeMethodsList}]
- تفاصيل فودافون كاش: ${vfText}
- تفاصيل انستا باي (InstaPay): ${instaText}
- الدفع عند الاستلام (COD): متاح لجميع المحافظات ✅
- وسائل التواصل: ${siteSettings?.storePhone ? `تلفون: ${siteSettings.storePhone}` : ""} ${siteSettings?.storeEmail ? `إيميل: ${siteSettings.storeEmail}` : ""}`;
    } catch (dbErr) {
      console.error("Failed to fetch live context for chatbot:", dbErr);
    }

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

بيانات المتجر والمعلومات المتاحة لحظياً من قاعدة البيانات:
${storeSettingsSummary}

أقسام المتجر المتاحة:
${categoriesSummary || "ملابس عصرية رجالي وحريمي وأوفر سايز"}

أسعار الشحن للمحافظات:
${shippingSummary || "القاهرة والجيزة: 50 ج.م، باقي المحافظات بين 55 إلى 95 ج.م"}

كتالوج المنتجات والخصومات الحالية:
${productsSummary}`;

    const trimmedMessages = messages.slice(-8);

    // ── 1. Gemini AI Models Primary (الأساسي الأول) ──
    if (geminiKey) {
      const geminiModels = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.5-flash",
      ];
      for (const model of geminiModels) {
        try {
          console.log(`[LUNO Chat] Calling Gemini model [${model}]...`);

          let geminiContents = trimmedMessages.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          }));

          while (geminiContents.length > 0 && geminiContents[0].role !== "user") {
            geminiContents = geminiContents.slice(1);
          }

          interface GeminiPart {
            role: string;
            parts: { text: string }[];
          }

          const mergedContents: GeminiPart[] = [];
          for (const item of geminiContents) {
            if (
              mergedContents.length > 0 &&
              mergedContents[mergedContents.length - 1].role === item.role
            ) {
              mergedContents[mergedContents.length - 1].parts[0].text +=
                "\n" + item.parts[0].text;
            } else {
              mergedContents.push({
                role: item.role,
                parts: [{ text: item.parts[0].text }],
              });
            }
          }
          geminiContents = mergedContents;

          if (geminiContents.length > 0) {
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
                console.log(`[LUNO Chat] Gemini [${model}] succeeded!`);
                return NextResponse.json(
                  { reply: botText, text: botText, message: botText, provider: `Gemini (${model})` },
                  {
                    headers: { "Access-Control-Allow-Origin": "*" },
                  }
                );
              }
            } else {
              const errText = await response.text();
              console.error(`[LUNO Chat] Gemini [${model}] error:`, response.status, errText);
            }
          }
        } catch (geminiErr) {
          console.error(`[LUNO Chat] Gemini [${model}] fetch failed:`, geminiErr);
        }
      }
    }

    // ── 2. Groq AI Models Fallback (الاحتياطي الثاني) ──
    if (groqKey) {
      const groqModels = [
        "llama-3.3-70b-versatile",
        "llama-3.3-70b-specdec",
        "llama-3.1-8b-instant",
      ];
      for (const model of groqModels) {
        try {
          console.log(`[LUNO Chat] Gemini failed/unavailable. Calling Groq [${model}]...`);
          const groqMessages = [
            { role: "system", content: systemContext },
            ...trimmedMessages.map((m) => ({
              role: m.role === "user" ? "user" : "assistant",
              content: m.content,
            })),
          ];

          const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${groqKey}`,
              },
              body: JSON.stringify({
                model,
                messages: groqMessages,
                temperature: 0.7,
                max_tokens: 800,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const botText = data.choices?.[0]?.message?.content;
            if (botText) {
              console.log(`[LUNO Chat] Groq [${model}] succeeded!`);
              return NextResponse.json(
                { reply: botText, text: botText, message: botText, provider: `Groq (${model})` },
                {
                  headers: { "Access-Control-Allow-Origin": "*" },
                }
              );
            }
          } else {
            const errText = await response.text();
            console.error(`[LUNO Chat] Groq [${model}] error:`, response.status, errText);
          }
        } catch (groqErr) {
          console.error(`[LUNO Chat] Groq [${model}] fetch failed:`, groqErr);
        }
      }
    }

    return NextResponse.json(
      {
        reply:
          "عذراً يا فندم، الخادم يواجه ضغطاً كبيراً حالياً ولا يمكنه الاتصال بالذكاء الاصطناعي. يرجى المحاولة بعد قليل. 🌸",
        text: "عذراً يا فندم، الخادم يواجه ضغطاً كبيراً حالياً ولا يمكنه الاتصال بالذكاء الاصطناعي. يرجى المحاولة بعد قليل. 🌸",
        message: "عذراً يا فندم، الخادم يواجه ضغطاً كبيراً حالياً. يرجى المحاولة بعد قليل.",
        error: "جميع محاولات الاتصال بالذكاء الاصطناعي فشلت",
      },
      {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    console.error("Critical chatbot crash:", err);
    return NextResponse.json(
      {
        reply: "عذراً، حدث خطأ غير متوقع في الخادم. يرجى إعادة المحاولة.",
        text: "عذراً، حدث خطأ غير متوقع في الخادم.",
        message: "عذراً، حدث خطأ غير متوقع في الخادم.",
        error: errorMsg,
      },
      {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}
