import { useRef, useState } from "react";
import api from "../../lib/axios";
import LazyTable from "../../components/tables/LazyTable";
import Helper from "../../utils/helper";
import { languageStore, toBengaliNum } from "../../stores/language.store";
import {
  Bot,
  Loader2,
  Send,
  Sparkles,
  RefreshCw,
  Boxes,
  PackageX,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";

type StockStatus = "out_of_stock" | "low" | "healthy";
type DemandLevel = "high" | "medium" | "low" | "none";

interface ProductAssessment {
  productID: number;
  productName: string;
  stock: number;
  alertQty: number;
  demandLevel: DemandLevel;
  stockStatus: StockStatus;
  suggestedOrderQty: number;
  suggestedSupplierID: number | null;
  leadTimeDays: number | null;
  minOrderQty: number | null;
}

interface AnalysisMetrics {
  generatedAt: string;
  totals: { products: number; outOfStock: number; lowStock: number };
  products: ProductAssessment[];
}

interface AiAnalysis {
  analysis: string;
  provider?: string;
  model?: string;
  generatedAt?: string;
  metrics?: AnalysisMetrics;
  disclaimer?: string;
}

interface Exchange {
  id: string;
  question: string;
  answer: string;
  error?: boolean;
}

const SUGGESTIONS = [
  { en: "Give me a quick inventory health summary.", bn: "ইনভেন্টরি অবস্থার সংক্ষিপ্ত সারসংক্ষেপ দিন।" },
  { en: "Which products are low on stock?", bn: "কোন পণ্যগুলোর স্টক কম?" },
  { en: "What should I reorder right now?", bn: "এখনই কী পুনরায় অর্ডার করা উচিত?" },
  { en: "Which products have the highest demand?", bn: "কোন পণ্যের চাহিদা সবচেয়ে বেশি?" },
];

const AiAssistant = () => {
  const { language } = languageStore();
  const t = (en: string, bn: string): string => (language === "bn" ? bn : en);
  const loc = (n: string | number): string =>
    language === "bn" ? toBengaliNum(n) : String(n);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);
  const [meta, setMeta] = useState<{ provider?: string; model?: string; generatedAt?: string; disclaimer?: string }>({});

  const inputRef = useRef<HTMLInputElement>(null);

  const statusLabel = (status: StockStatus): string => {
    if (status === "out_of_stock") return t("Out of stock", "স্টক নেই");
    if (status === "low") return t("Low", "কম");
    return t("Healthy", "পর্যাপ্ত");
  };

  const statusClass = (status: StockStatus): string => {
    if (status === "out_of_stock") return "text-red-600 dark:text-red-400";
    if (status === "low") return "text-amber-600 dark:text-amber-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  const demandLabel = (level: DemandLevel): string => {
    if (level === "high") return t("High", "বেশি");
    if (level === "medium") return t("Medium", "মধ্যম");
    if (level === "low") return t("Low", "কম");
    return t("None", "নেই");
  };

  const ask = async (raw: string) => {
    const q = raw.trim();
    if (!q || loading) return;

    setLoading(true);
    setQuestion("");

    try {
      const res = await api.post<{ success: boolean; data: AiAnalysis }>("/ai/analyze", {
        question: q,
      });
      const data = res.data?.data;
      const answer =
        data?.analysis?.trim() ||
        t("The assistant returned an empty response.", "সহকারী কোনো উত্তর দেয়নি।");

      setExchanges((prev) => [
        { id: `x-${Date.now()}`, question: q, answer },
        ...prev,
      ]);

      if (data?.metrics) setMetrics(data.metrics);
      setMeta({
        provider: data?.provider,
        model: data?.model,
        generatedAt: data?.generatedAt,
        disclaimer: data?.disclaimer,
      });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t("Sorry, the assistant is unavailable right now.", "দুঃখিত, সহকারী এখন উপলব্ধ নয়।");
      setExchanges((prev) => [
        { id: `x-${Date.now()}`, question: q, answer: message, error: true },
        ...prev,
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const reorderList = (metrics?.products ?? []).filter((p) => p.suggestedOrderQty > 0);

  const cards = [
    {
      label: t("Assessed products", "মূল্যায়িত পণ্য"),
      value: metrics ? loc(metrics.totals.products) : "—",
      icon: <Boxes size={16} />,
    },
    {
      label: t("Out of stock", "স্টক নেই"),
      value: metrics ? loc(metrics.totals.outOfStock) : "—",
      icon: <PackageX size={16} />,
    },
    {
      label: t("Low stock", "স্বল্প স্টক"),
      value: metrics ? loc(metrics.totals.lowStock) : "—",
      icon: <AlertTriangle size={16} />,
    },
    {
      label: t("Reorder needed", "পুনরায় অর্ডার প্রয়োজন"),
      value: metrics ? loc(reorderList.length) : "—",
      icon: <ClipboardList size={16} />,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-indigo-600" />
          <div>
            <h1 className="global_heading">{t("AI Assistant", "এআই সহকারী")}</h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {t(
                "Ask about your inventory. Numbers are calculated by the backend; the AI only explains.",
                "আপনার ইনভেন্টরি সম্পর্কে জিজ্ঞাসা করুন। সংখ্যা ব্যাকএন্ডে হিসাব করা হয়; এআই শুধু ব্যাখ্যা করে।"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Deterministic metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 flex flex-col gap-1"
          >
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
              {card.icon}
              {card.label}
            </div>
            <div className="text-xl font-medium text-gray-900 dark:text-white">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Ask box */}
      <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-4 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask(question);
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("Type your question...", "আপনার প্রশ্ন লিখুন...")}
            className="global_input flex-1"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="global_button flex items-center gap-1.5 disabled:opacity-40"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {t("Ask", "জিজ্ঞাসা")}
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.en}
              type="button"
              disabled={loading}
              onClick={() => void ask(t(s.en, s.bn))}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 dark:border-neutral-700 dark:text-zinc-300 dark:hover:text-indigo-400"
            >
              {t(s.en, s.bn)}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation */}
      {exchanges.length > 0 && (
        <div className="space-y-3">
          {exchanges.map((x) => (
            <div
              key={x.id}
              className="rounded-xl border border-gray-200 dark:border-neutral-700 p-4 space-y-3"
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-xs font-semibold text-indigo-600">
                  {t("You", "আপনি")}
                </span>
                <p className="text-sm text-gray-700 dark:text-zinc-300">{x.question}</p>
              </div>
              <div className="flex items-start gap-2 border-t border-gray-100 pt-3 dark:border-neutral-700">
                <Bot size={16} className="mt-0.5 shrink-0 text-indigo-600" />
                <p
                  className={`whitespace-pre-wrap text-sm ${
                    x.error
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-800 dark:text-zinc-100"
                  }`}
                >
                  {x.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reorder suggestions */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList size={16} className="text-indigo-500" />
          <h2 className="text-sm font-medium">
            {t("Suggested reorders", "প্রস্তাবিত পুনরায় অর্ডার")}
          </h2>
          {loading && <RefreshCw size={13} className="animate-spin text-gray-400" />}
        </div>
        <LazyTable
          data={reorderList}
          keyExtractor={(row) => row.productID}
          columns={[
            { header: t("Product", "পণ্য"), accessor: "productName" },
            {
              header: t("Stock", "স্টক"),
              accessor: (row) => loc(row.stock),
              className: "text-center",
              headerClassName: "text-center",
            },
            {
              header: t("Status", "অবস্থা"),
              accessor: (row) => (
                <span className={statusClass(row.stockStatus)}>
                  {statusLabel(row.stockStatus)}
                </span>
              ),
              className: "text-center",
              headerClassName: "text-center",
            },
            {
              header: t("Demand", "চাহিদা"),
              accessor: (row) => demandLabel(row.demandLevel),
              className: "text-center",
              headerClassName: "text-center",
            },
            {
              header: t("Suggest Qty", "প্রস্তাবিত পরিমাণ"),
              accessor: (row) => loc(row.suggestedOrderQty),
              className: "text-center",
              headerClassName: "text-center",
            },
          ]}
          footer={() => (
            <tr>
              <td colSpan={5} className="text-center text-xs text-gray-400">
                {reorderList.length === 0
                  ? t(
                      "Ask the assistant to load the latest suggestions.",
                      "সর্বশেষ পরামর্শ দেখতে সহকারীকে জিজ্ঞাসা করুন।"
                    )
                  : ""}
              </td>
            </tr>
          )}
        />
      </div>

      {/* Meta / disclaimer */}
      {(meta.provider || meta.disclaimer) && (
        <div className="text-xs text-gray-400 dark:text-zinc-500 space-y-1">
          {(meta.provider || meta.model) && (
            <p>
              {t("Provider", "প্রোভাইডার")}: {meta.provider || "—"}
              {meta.model ? ` · ${meta.model}` : ""}
              {meta.generatedAt
                ? ` · ${Helper.formatDate(new Date(meta.generatedAt))}`
                : ""}
            </p>
          )}
          {meta.disclaimer && <p>{meta.disclaimer}</p>}
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
