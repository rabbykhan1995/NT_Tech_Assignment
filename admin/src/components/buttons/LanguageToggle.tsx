import { languageStore } from "../../stores/language.store";

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = languageStore();

  return (
    <div className="flex items-center rounded-sm overflow-hidden shadow-md border border-[rgb(var(--primary-border))] text-xs font-semibold">
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 uppercase transition cursor-pointer ${
          language === "en"
            ? "bg-[rgb(var(--global-button-bg))] text-[rgb(var(--primary-text))]"
            : "bg-transparent hover:bg-orange-500/20"
        }`}
        title="English"
        aria-label="English"
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("bn")}
        className={`px-2 py-1 transition cursor-pointer ${
          language === "bn"
            ? "bg-[rgb(var(--global-button-bg))] text-[rgb(var(--primary-text))]"
            : "bg-transparent hover:bg-orange-500/20"
        }`}
        title="বাংলা"
        aria-label="বাংলা"
      >
        বাং
      </button>
    </div>
  );
};

export default LanguageToggle;