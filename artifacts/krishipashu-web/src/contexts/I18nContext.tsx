import React, { createContext, useContext, useState, useCallback } from "react";
import en from "@/translations/en.json";
import hi from "@/translations/hi.json";
import mr from "@/translations/mr.json";

type Language = "en" | "hi" | "mr";
type Translations = Record<string, string>;

const translations: Record<Language, Translations> = { en, hi, mr };

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(
    () => (localStorage.getItem("language") as Language) || "en"
  );

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem("language", lang);
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[language][key] || translations["en"][key] || key;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
