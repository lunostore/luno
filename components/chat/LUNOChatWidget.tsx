"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles, ShoppingBag, ExternalLink, Bot, RefreshCw } from "lucide-react";
import { useProductModal } from "@/features/product-modal/ProductModalProvider";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  provider?: string;
}

const CHATBOT_ENDPOINT =
  process.env.NEXT_PUBLIC_CHATBOT_API_URL || "https://luno-lunostore.web.val.run";

const QUICK_PROMPTS = [
  "🔥 أرشحلي أحدث المنتجات المصممة بأعلى جودة",
  "👕 ايه هي خامات الملابس والقصات المتوفرة؟",
  "🚚 ما هي مواعيد الشحن وطرق الدفع المتاحة؟",
];

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

      if (!response.ok) {
        throw new Error("عذراً، لم أتمكن من الاتصال بالخادم.");
      }

      const data = await response.json();
      const botReply = data.reply || data.message || "عذراً، لم أتمكن من فهم طلبك حالياً.";

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

  // Helper to parse message text and render clickable product links
  const renderFormattedMessage = (content: string) => {
    const productIdRegex = /(?:https?:\/\/luno-store\.com\/products\?id=|\/products\?id=)([a-zA-Z0-9_-]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = productIdRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const prodId = match[1];
      const index = match.index;

      if (index > lastIndex) {
        parts.push(content.substring(lastIndex, index));
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

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
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
            className="fixed bottom-24 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-[400px] h-[540px] max-h-[80vh] bg-zinc-950/95 dark:bg-black/95 text-white border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
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
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed font-sans shadow-md ${
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
