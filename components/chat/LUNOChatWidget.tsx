"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Bot,
  RefreshCw,
  ShoppingCart,
  Check,
} from "lucide-react";
import { useProductModal } from "@/features/product-modal/ProductModalProvider";
import { useCart } from "@/features/cart/CartProvider";
import { getProductById, logChatEvent } from "@/lib/firebase/firestore";
import type { Product } from "@/types/product";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  provider?: string;
}

const CHATBOT_ENDPOINT =
  process.env.NEXT_PUBLIC_CHATBOT_API_URL || "https://luno--d775de94945311f1a7231607ee4eb77e.web.val.run/";

const QUICK_PROMPTS = [
  "🔥 أرشحلي أحدث المنتجات المصممة بأعلى جودة",
  "👕 ايه هي خامات الملابس والقصات المتوفرة؟",
  "🚚 ما هي مواعيد الشحن وطرق الدفع المتاحة؟",
];

// ── In-Chat Interactive Product Card Component ────────────

function InChatProductCard({
  productId,
  defaultColor,
  defaultSize,
}: {
  productId: string;
  defaultColor?: string;
  defaultSize?: string;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColorName, setSelectedColorName] = useState(defaultColor || "");
  const [selectedSize, setSelectedSize] = useState(defaultSize || "");
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCart();
  const { openProduct } = useProductModal();

  useEffect(() => {
    let isMounted = true;
    getProductById(productId).then((prod) => {
      if (isMounted && prod) {
        setProduct(prod);
        if (!selectedColorName && prod.variants?.[0]?.colorName) {
          setSelectedColorName(prod.variants[0].colorName);
        }
        if (!selectedSize) {
          const firstVariant = prod.variants?.[0];
          const availableSize =
            firstVariant?.sizes?.find((s) => s.stock > 0)?.size ||
            firstVariant?.sizes?.[0]?.size ||
            "M";
          setSelectedSize(availableSize);
        }
        logChatEvent("product_recommended", { productId: prod.id, productName: prod.name });
      }
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="my-2 p-3 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse text-xs text-zinc-400">
        جاري تحميل المنتج المقترح...
      </div>
    );
  }

  if (!product) return null;

  const currentVariant =
    product.variants?.find((v) => v.colorName.toLowerCase() === selectedColorName.toLowerCase()) ||
    product.variants?.[0];

  const colorObj = currentVariant
    ? { name: currentVariant.colorName, hex: currentVariant.colorHex || "#000000", image: currentVariant.image || product.mainImage }
    : { name: "افتراضي", hex: "#000000", image: product.mainImage };

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addItem(product, 1, selectedSize, colorObj);
    setAdded(true);
    logChatEvent("add_to_cart_click", {
      productId: product.id,
      productName: product.name,
      selectedColor: colorObj.name,
      selectedSize: selectedSize,
      price: product.salePrice && product.salePrice < product.price ? product.salePrice : product.price,
    });
    openCart();
    setTimeout(() => setAdded(false), 2500);
  };

  const finalPrice = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;

  return (
    <div className="my-2.5 p-3.5 bg-zinc-900/95 border border-amber-500/30 rounded-2xl shadow-xl flex flex-col gap-2.5 text-right font-sans">
      <div className="flex gap-3 items-center">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-zinc-800 relative">
          <img src={colorObj.image || product.mainImage} alt={product.name} className="w-full h-full object-cover" />
          {product.salePrice && product.salePrice < product.price && (
            <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
              خصم
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-xs text-white truncate">{product.name}</h4>
          <div className="flex items-baseline gap-2 mt-0.5 font-mono">
            <span className="text-amber-400 font-extrabold text-xs">{finalPrice} ج.م</span>
            {product.salePrice && product.salePrice < product.price && (
              <span className="line-through text-zinc-500 text-[10px]">{product.price} ج.م</span>
            )}
          </div>
          {product.material && (
            <p className="text-[10px] text-zinc-400 mt-0.5">الخامة: {product.material}</p>
          )}
        </div>
      </div>

      {/* Colors Swatches */}
      {product.variants && product.variants.length > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-300">
          <span className="text-zinc-400 font-medium">اللون:</span>
          <div className="flex flex-wrap gap-1">
            {product.variants.map((v) => (
              <button
                key={v.colorName}
                type="button"
                onClick={() => setSelectedColorName(v.colorName)}
                className={`px-2 py-0.5 rounded-full border text-[10px] font-medium transition-all ${
                  selectedColorName.toLowerCase() === v.colorName.toLowerCase()
                    ? "border-amber-400 bg-amber-400/20 text-amber-300 font-bold"
                    : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {v.colorName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sizes Selection */}
      {currentVariant?.sizes && currentVariant.sizes.length > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-300">
          <span className="text-zinc-400 font-medium">المقاس:</span>
          <div className="flex flex-wrap gap-1">
            {currentVariant.sizes.map((s) => (
              <button
                key={s.size}
                type="button"
                disabled={s.stock <= 0}
                onClick={() => setSelectedSize(s.size)}
                className={`px-2 py-0.5 rounded-md border text-[10px] font-bold transition-all ${
                  selectedSize === s.size
                    ? "border-amber-400 bg-amber-400 text-zinc-950"
                    : s.stock > 0
                    ? "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
                    : "border-zinc-800 bg-zinc-950 text-zinc-600 line-through opacity-50 cursor-not-allowed"
                }`}
              >
                {s.size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions: Direct Add to Cart & Open Modal */}
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={handleAddToCart}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md ${
            added
              ? "bg-emerald-500 text-zinc-950"
              : "bg-gradient-to-r from-[#D4B886] to-amber-500 text-zinc-950 hover:brightness-110 active:scale-95"
          }`}
        >
          {added ? <Check size={14} /> : <ShoppingCart size={14} />}
          <span>{added ? "تمت الإضافة للسلة!" : "إضافة إلى السلة بضغطة واحدة"}</span>
        </button>
        <button
          type="button"
          onClick={() => openProduct(product.id)}
          className="px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-all cursor-pointer"
        >
          التفاصيل
        </button>
      </div>
    </div>
  );
}

// ── Main Chat Widget Component ────────────────────────────

export function LUNOChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "أهلاً بك في LUNO Store! ✨ أنا المساعد الذكي LUNO Chat.\nكيف أقدر أساعدك النهاردة في اختيار ملابسك أو الإجابة عن أي استفسار؟",
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { openProduct } = useProductModal();

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      logChatEvent("chat_started");
    }
  }, [messages, isOpen, isLoading]);

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsLoading(true);

    try {
      // Build conversation payload
      const historyPayload = messages
        .filter((m) => m.id !== "welcome-1")
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      historyPayload.push({ role: "user", content: query });

      const response = await fetch(CHATBOT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyPayload }),
      });

      const data = await response.json().catch(() => ({}));
      const botReply =
        data.reply ||
        data.text ||
        data.message ||
        (response.ok ? "أهلاً بك! كيف يمكنني مساعدتك؟" : "عذراً، تعذر الوصول لخدمة الـ AI حالياً.");

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: botReply,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        provider: data.provider,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "عذراً، حدث خطأ مؤقت في الاتصال بالمساعد الذكي. يرجى المحاولة بعد قليل.",
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to parse message text and render interactive product cards & links & suggestion pills
  const renderFormattedMessage = (content: string) => {
    // 1. Extract suggestion pills tag: [SUGGESTIONS:item1|item2|item3]
    let suggestionPills: string[] = [];
    const suggestionsMatch = content.match(/\[SUGGESTIONS:(.*?)\]/);
    let cleanText = content;

    if (suggestionsMatch) {
      cleanText = cleanText.replace(suggestionsMatch[0], "");
      suggestionPills = suggestionsMatch[1].split("|").map((s) => s.trim()).filter(Boolean);
    }

    // 2. Extract [PRODUCT_CARD:id=XYZ:color=COLOR:size=SIZE]
    const cardRegex = /\[PRODUCT_CARD:id=([a-zA-Z0-9_-]+)(?::color=([^:\s]+))?(?::size=([^:\s]+))?\]/g;
    const cardMatches: { id: string; color?: string; size?: string }[] = [];
    let match;

    while ((match = cardRegex.exec(cleanText)) !== null) {
      cardMatches.push({
        id: match[1],
        color: match[2] || undefined,
        size: match[3] || undefined,
      });
    }

    cleanText = cleanText.replace(cardRegex, "");

    // 3. Extract links /products?id=XYZ
    const productIdRegex = /(?:https?:\/\/luno-store\.com\/products\?id=|\/products\?id=)([a-zA-Z0-9_-]+)/g;
    const parts = [];
    let lastIndex = 0;
    let linkMatch;

    while ((linkMatch = productIdRegex.exec(cleanText)) !== null) {
      const fullMatch = linkMatch[0];
      const prodId = linkMatch[1];
      const index = linkMatch.index;

      if (index > lastIndex) {
        parts.push(cleanText.substring(lastIndex, index));
      }

      parts.push(
        <button
          key={prodId + index}
          type="button"
          onClick={() => openProduct(prodId)}
          className="inline-flex items-center gap-1.5 bg-[#D4B886]/15 hover:bg-[#D4B886]/30 text-[#D4B886] border border-[#D4B886]/40 px-3 py-1 rounded-full text-xs font-bold transition-all my-1 cursor-pointer mx-1 shadow-sm active:scale-95"
        >
          <ShoppingBag size={13} />
          <span>عرض المنتج</span>
          <ExternalLink size={11} />
        </button>
      );

      lastIndex = index + fullMatch.length;
    }

    if (lastIndex < cleanText.length) {
      parts.push(cleanText.substring(lastIndex));
    }

    return (
      <div className="flex flex-col gap-1">
        <div>{parts.length > 0 ? parts : cleanText}</div>

        {/* Embedded Interactive Product Cards */}
        {cardMatches.map((c, i) => (
          <InChatProductCard key={c.id + i} productId={c.id} defaultColor={c.color} defaultSize={c.size} />
        ))}

        {/* Interactive Follow-up Suggestion Chips */}
        {suggestionPills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-zinc-800/60">
            {suggestionPills.map((text, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendMessage(text)}
                className="text-[10px] bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl px-2.5 py-1 transition-all cursor-pointer active:scale-95 font-medium"
              >
                💬 {text}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* ── FLOATING LAUNCHER BUTTON ── */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <motion.button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="relative group w-14 h-14 rounded-full bg-[#121212] border border-[#D4B886]/60 text-[#D4B886] flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.6)] cursor-pointer backdrop-blur-md overflow-hidden"
          title="LUNO AI Assistant"
        >
          {/* Subtle halo glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-transparent to-amber-300/10 group-hover:opacity-100 transition-opacity duration-500" />

          {isOpen ? (
            <X size={22} className="relative z-10 text-white" />
          ) : (
            <div className="relative z-10 flex items-center justify-center">
              <Sparkles size={22} className="text-[#D4B886] animate-pulse" />
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 rounded-full ring-4 ring-[#121212] shadow-sm" />
            </div>
          )}
        </motion.button>
      </div>

      {/* ── CHAT WINDOW OVERLAY ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-[400px] h-[560px] max-h-[80vh] bg-zinc-950/95 dark:bg-black/95 text-white border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
            dir="rtl"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-zinc-900 to-zinc-800 border border-zinc-700 flex items-center justify-center shadow-inner relative">
                  <Bot size={20} className="text-[#D4B886]" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-zinc-900" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-sm text-white tracking-wide">LUNO Chat AI</h3>
                    <span className="text-[9px] font-extrabold uppercase bg-amber-400/10 border border-amber-400/30 text-amber-300 px-2 py-0.5 rounded-full">
                      مباشر
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">مساعدك الذكي لاختيار الأزياء</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed font-sans shadow-md ${
                        isUser
                          ? "bg-[#D4B886] text-zinc-950 rounded-br-none font-bold"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none whitespace-pre-line"
                      }`}
                    >
                      {isUser ? msg.content : renderFormattedMessage(msg.content)}
                    </div>
                    <span className="text-[9px] text-zinc-500 mt-1 px-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </motion.div>
                );
              })}

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-zinc-400 text-xs py-2 px-1">
                  <RefreshCw size={13} className="animate-spin text-amber-400" />
                  <span>جاري التفكير وكتابة الرد...</span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Starter Prompts */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 border-t border-zinc-800/40 bg-zinc-900/30 flex flex-col gap-1.5 flex-shrink-0">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">أسئلة مقترحة:</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((promptText, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => sendMessage(promptText)}
                      className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-right transition-all cursor-pointer active:scale-95"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/80 flex items-center gap-2 flex-shrink-0">
              <input
                type="text"
                placeholder="اكتب سؤالك هنا لمساعد LUNO..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-400/80 text-white placeholder-zinc-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-[#D4B886] hover:bg-[#C5A775] text-zinc-950 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 flex-shrink-0"
                title="إرسال"
              >
                <Send size={15} className="rotate-180" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
