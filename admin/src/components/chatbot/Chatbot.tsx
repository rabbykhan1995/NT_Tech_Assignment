import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import api from "../../lib/axios";
import { languageStore } from "../../stores/language.store";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface AiAnalysis {
  analysis: string;
  provider?: string;
  model?: string;
  generatedAt?: string;
  disclaimer?: string;
}

const SUGGESTIONS = [
  { en: "Give me a quick inventory health summary.", bn: "ইনভেন্টরি অবস্থার সংক্ষিপ্ত সারসংক্ষেপ দিন।" },
  { en: "Which products are low on stock?", bn: "কোন পণ্যগুলোর স্টক কম?" },
  { en: "What should I reorder right now?", bn: "এখনই কী পুনরায় অর্ডার করা উচিত?" },
];

export default function Chatbot() {
  const { language } = languageStore();
  const t = (en: string, bn: string): string => (language === "bn" ? bn : en);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post<{ success: boolean; data: AiAnalysis }>(
        "/ai/analyze",
        { question: trimmed }
      );

      const analysis = res.data?.data?.analysis;
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            analysis?.trim() ||
            t("The assistant returned an empty response.", "সহকারী কোনো উত্তর দেয়নি।"),
        },
      ]);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t("Sorry, the assistant is unavailable right now.", "দুঃখিত, সহকারী এখন উপলব্ধ নয়।");
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700"
        aria-label={t("Open AI assistant", "এআই সহকারী খুলুন")}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-40 flex h-[520px] max-h-[calc(100dvh-7rem)] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-[#202020]">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-gray-100 bg-indigo-600 px-4 py-3 text-white dark:border-neutral-700">
            <Bot size={18} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold">{t("AI Assistant", "এআই সহকারী")}</h3>
              <p className="text-[11px] opacity-80">
                {t("Ask about your inventory", "আপনার ইনভেন্টরি সম্পর্কে জিজ্ঞাসা করুন")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 hover:bg-white/20"
              aria-label={t("Close", "বন্ধ করুন")}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 && (
              <div className="space-y-3 text-center">
                <div className="mt-6 flex flex-col items-center gap-2 text-gray-400">
                  <Sparkles size={28} />
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    {t(
                      "Hi! I can explain your inventory, stock levels and reorder suggestions.",
                      "হ্যালো! আমি আপনার ইনভেন্টরি, স্টক ও পুনরায় অর্ডারের পরামর্শ ব্যাখ্যা করতে পারি।"
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.en}
                      type="button"
                      onClick={() => send(t(s.en, s.bn))}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-left text-xs text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-neutral-700 dark:text-zinc-300 dark:hover:text-indigo-400"
                    >
                      {t(s.en, s.bn)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-zinc-100"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-500 dark:bg-neutral-800 dark:text-zinc-400">
                  <Loader2 size={14} className="animate-spin" />
                  {t("Thinking...", "ভাবছে...")}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-gray-100 p-3 dark:border-neutral-700"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("Type your question...", "আপনার প্রশ্ন লিখুন...")}
              className="global_input flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-40"
              aria-label={t("Send", "পাঠান")}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
