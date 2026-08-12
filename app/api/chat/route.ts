import { NextResponse } from "next/server";
import { getProducts, getCategories, getShippingRates, getSiteSettings } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";

interface ChatPayloadMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/** Purify bot text from any accidental foreign language unicode characters (Chinese, Korean, Japanese, Thai, Cyrillic) */
function sanitizeBotText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u4e00-\u9fa5\uac00-\ud7af\u3040-\u30ff\u0e00-\u0e7f\u0400-\u04ff]/g, "")
    .replace(/[^\S\r\n]+/g, " ")
    .trim();
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
          .slice(0, 30)
          .map((p, idx) => {
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

            const matText = p.material && p.material.trim() ? p.material.trim() : "100% قطن فاخر";

            return `• منتج ${idx + 1}: ${p.name}
  - المعرف (ID): ${p.id}
  - السعر: ${priceText}
  - القسم: ${p.category || "عام"}
  - نوع خامة وقماش المنتج المكتوب بالأدمن: (${matText})
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

معلومات عن مؤسسي وأصحاب براند LUNO Store (إذا سأل العميل "مين صاحب البراند" أو "مين المؤسسين" أو أي سؤال مشابه):
LUNO Store تأسس على يد 3 أشخاص شركاء:
1. يوسف — مهندس ذكاء اصطناعي (AI Engineer) ومسؤول التطوير التقني
2. مصطفى — دكتور ومسؤول الإدارة والجودة
3. زياد — تبّاع وشخص ملهوش لازمة عمتاً

قواعد مهمة جداً لضمان جودة الرد واللغة العربية الصافية:
1. يمنع منعاً باتاً كلياً استخدام أي حروف أو كلمات باللغة الكورية أو الصينية أو اليابانية أو التايلاندية أو أي لغة غير عربية. تحدث باللغة العربية الفصحى الواضحة والودودة فقط!
2. الصدق والأمانة والدقة الفائقة في خامات المنتجات وطرق الدفع (مهم جداً جداً):
   - عندما يسألك العميل عن نوع خامة أو قماش المنتج، اذكر له نوع الخامة المسجلة بالنظام أدناه بدقة ووضوح (مثل: 100% قطن، ميلتون، إلخ).
   - يقرأ السيستم حالة الدفع المتاحة لحظياً. إذا كانت طريقة دفع معطّلة (سواء فودافون كاش أو انستا باي)، وسألك العميل عنها، أخبره بصراحة وشياكة: "حالياً متاح طريقة كذا فقط (اذكر المفعّل فقط) وطريقة كذا غير متاحة حالياً."
   - جاوب بالرقم أو الحساب المكتوب في البيانات أعلاه فقط إذا كانت الطريقة مفعّلة. يمنع منعاً باتاً اختراع أو تأليف أي رقم أو حساب وهمي إطلاقاً!
3. متى ترفق كارت المنتج التفاعلي [PRODUCT_CARD]؟ (مهم جداً لسلاسة المحادثة):
   - ارفق كارت المنتج التفاعلي [PRODUCT_CARD:id=PRODUCT_ID:color=اسم_اللون:size=المقاس] فقط وفقط إذا طلب العميل رؤية المنتجات، أو سأل عن الشراء، أو ترشيح قطعة ملابس!
   - إذا كان سؤال العميل عن الشحن، المحافظات، فودافون كاش، انستا باي، طرق الدفع، أو سلام/تحية (مثل أهلاً، شكراً)، يمنع منعاً باتاً إرفاق كارت المنتج. جاوب على سؤال العميل مباشرة وبشكل سلس وطبيعي جداً بدون إقحام كروت منتجات!

4. اكتب أيضاً رابط المنتج التقليدي /products?id=PRODUCT_ID فقط عند ترشيح منتج للعميل.
5. يمنع منعاً باتاً إضافة أي أسئلة اقتراحية أو تاجات أسئلة ثابتة مثل [SUGGESTIONS] أسفل كروت المنتجات أو في نهاية الرد. يجب أن ينتهي ردك بشكل طبيعي دون إضافة أي أسئلة مقترحة في النهاية.
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
                  generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
                }),
              }
            );

            if (response.ok) {
              const data = await response.json();
              const botText = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (botText) {
                const cleanText = sanitizeBotText(botText);
                return NextResponse.json(
                  { reply: cleanText, text: cleanText, message: cleanText, provider: `Gemini (${model})` },
                  {
                    headers: { "Access-Control-Allow-Origin": "*" },
                  }
                );
              }
            }
          }
        } catch (geminiErr) {
          console.error(`Gemini [${model}] fetch failed:`, geminiErr);
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
                temperature: 0.2,
                max_tokens: 800,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const botText = data.choices?.[0]?.message?.content;
            if (botText) {
              const cleanText = sanitizeBotText(botText);
              return NextResponse.json(
                { reply: cleanText, text: cleanText, message: cleanText, provider: `Groq (${model})` },
                {
                  headers: { "Access-Control-Allow-Origin": "*" },
                }
              );
            }
          }
        } catch (groqErr) {
          console.error(`Groq [${model}] fetch failed:`, groqErr);
        }
      }
    }

    return NextResponse.json(
      {
        reply:
          "عذراً يا فندم، الخادم يواجه ضغطاً كبيراً حالياً ولا يمكنه الاتصال بالذكاء الاصطناعي. يرجى المحاولة بعد قليل. 🌸",
        text: "عذراً يا فندم، الخادم يواجه ضغطاً كبيراً حالياً. يرجى المحاولة بعد قليل. 🌸",
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
