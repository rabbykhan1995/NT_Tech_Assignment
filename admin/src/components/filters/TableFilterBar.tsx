import { Search, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { Dropdown } from "../Ui/Dropdown";
import { languageStore } from "../../stores/language.store";

// ─── Dropdown ────────────────────────────────────────────────────────────────


// ─── TableFilterBar ──────────────────────────────────────────────────────────

type TableFilterBarProps = {
  title: string;
  subtitle?: string;
  search: string;
  onSearchChange: (value: string) => void;
  addHref?: string;
  addLabel?: string;
  limit: number;
  onLimitChange: (value: number) => void;
  disableSearch?: boolean

};

export default function TableFilterBar({
  title,
  subtitle,
  search,
  onSearchChange,
  addHref,
  addLabel,
  limit,
  onLimitChange,
  disableSearch = false
}: TableFilterBarProps) {
  const navigate = useNavigate();
  const { language } = languageStore();
  const t = (en: string, bn: string): string => (language === "bn" ? bn : en);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      {/* Left */}
      <div className="lg:w-1/4">
        <h1 className="global_heading">{title}</h1>
        {subtitle && <p className="text-xs opacity-50">{subtitle}</p>}
      </div>

      {/* Right */}
      <div className="flex flex-col lg:flex-row items-center justify-end gap-3 lg:w-3/4">
        {/* Search */}
{!disableSearch   &&     <div className="relative w-full lg:w-6/8">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"
            size={14}
          />
          <input
            type="text"
            placeholder={t("Search...", "অনুসন্ধান...")}
            className="pl-9 global_input w-full"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>}

        {/* Limit */}
        <div className="w-full lg:w-2/8">
          <Dropdown
            value={limit}
            options={[10, 20, 50, 100]}
            onChange={onLimitChange}
            title={t("/ page", "/ পৃষ্ঠা")}

          />
        </div>

        {/* Add Button */}
        {addHref && (
          <button
            type="button"
            onClick={() => navigate(addHref)}
            className="global_button flex items-center gap-2"
          >
            <Plus size={16} />
            <span>{addLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}