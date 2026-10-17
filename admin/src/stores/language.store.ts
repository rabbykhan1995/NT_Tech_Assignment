import { create } from "zustand";

export type Language = "en" | "bn";

const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export const toBengaliNum = (input: string | number): string =>
  String(input).replace(/[0-9]/g, (d) => BENGALI_DIGITS[Number(d)]);

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const languageStore = create<LanguageState>((set, get) => ({
  language: (() => {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem("language");
    return stored === "bn" ? "bn" : "en";
  })(),

  setLanguage: (lang: Language) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang);
    }
    set({ language: lang });
  },

  toggleLanguage: () => {
    get().setLanguage(get().language === "en" ? "bn" : "en");
  },
}));