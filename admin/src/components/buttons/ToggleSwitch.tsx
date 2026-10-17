import { languageStore } from "../../stores/language.store";

type ToggleSwitchProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  tooltip?: string;
};

export default function ToggleSwitch({ label, value, onChange, disabled = false, tooltip }: ToggleSwitchProps){
  const { language } = languageStore();
  const t = (en: string, bn: string): string => (language === "bn" ? bn : en);

  return (
    <div className={`flex items-center gap-2 ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}>
      <span className="text-xs font-medium">{label}</span>
      {tooltip && (
        <span className="group relative inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 text-[10px] font-bold text-white cursor-help select-none">
          ?
          <span className="pointer-events-none absolute left-1/2 bottom-full z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 dark:bg-gray-700 px-2 py-1 text-xs font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 w-max max-w-xs">
            {tooltip}
          </span>
        </span>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onChange(!value)}
        className={`w-9 h-5 flex items-center rounded-full px-[2px] transition-all duration-300 ${
          value ? "bg-[rgb(var(--global-button-bg))]" : "bg-gray-300 dark:bg-gray-600"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className={`w-3 h-3 bg-white rounded-full shadow transition-all duration-300 ${value ? "translate-x-4" : "translate-x-0"}`} />
      </button>
      <span className="text-xs opacity-60">{value ? t("Yes", "হ্যাঁ") : t("No", "না")}</span>
    </div>
  );
};