import { MoveLeft, MoveRight } from "lucide-react";
import { languageStore, toBengaliNum } from "../../stores/language.store";

type PaginationProps = {
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  total,
  page,
  limit,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  const { language } = languageStore();
  const isBn = language === "bn";
  const loc = (n: number) => (isBn ? toBengaliNum(n) : String(n));

  return (




    <div className="flex items-center gap-2 justify-center mb-5 text-sm lg:text-base">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1 flex items-center gap-2 justify-center border min-w-[100px] border-slate-300 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MoveLeft size={10} />  {isBn ? "পূর্ববর্তী" : "Previous"}
      </button>

      <span className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600">
        {loc(page)} / {loc(totalPages)} {isBn ? "পৃষ্ঠা" : "Page"}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="lg:px-3 px-1 py-1 flex items-center gap-2 justify-center border lg:min-w-[100px] border-slate-300 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isBn ? "পরবর্তী" : "Next"} <MoveRight size={10} />
      </button>
    </div>


  );
}