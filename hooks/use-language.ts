"use client";

import * as React from "react";
import { LANGUAGES, type Language } from "@/lib/constants";
import { translations, getTranslation } from "@/lib/translations";

const STORAGE_KEY = "mppiti.language";

function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

export type AppTranslation = typeof translations.en | typeof translations.hi;

export interface LanguageContextType {
  language: Language;
  setLanguage: (next: Language) => void;
  ready: boolean;
  t: AppTranslation;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<Language>("hi");
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const queryLang = urlParams.get("lang");
      if (isLanguage(queryLang)) {
        setLanguageState(queryLang);
        window.localStorage.setItem(STORAGE_KEY, queryLang);
        setReady(true);
        return;
      }
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isLanguage(stored)) {
        setLanguageState(stored);
      } else {
        window.localStorage.setItem(STORAGE_KEY, "hi");
      }
    } catch {
      // Ignore
    }
    setReady(true);
  }, []);

  const setLanguage = React.useCallback((next: Language) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent("mppiti-language-change", { detail: next }));
    } catch {
      // Ignore
    }
  }, []);

  React.useEffect(() => {
    function handleEvent(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (isLanguage(detail)) setLanguageState(detail);
    }
    window.addEventListener("mppiti-language-change", handleEvent);
    return () => window.removeEventListener("mppiti-language-change", handleEvent);
  }, []);

  const t = getTranslation(language);

  return React.createElement(
    LanguageContext.Provider,
    { value: { language, setLanguage, ready, t } },
    children,
  );
}

export function useLanguage(): LanguageContextType {
  const context = React.useContext(LanguageContext);
  if (context) return context;

  return {
    language: "hi",
    setLanguage: () => {},
    ready: true,
    t: translations.hi,
  };
}
