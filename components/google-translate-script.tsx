"use client";

import * as React from "react";
import Script from "next/script";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

export function GoogleTranslateScript() {
  React.useEffect(() => {
    // Define the callback before the Google script executes
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi",
            autoDisplay: false,
          },
          "google_translate_element",
        );
      }
    };

    function triggerGoogleTranslate(lang: string) {
      try {
        const domain = window.location.hostname;
        document.cookie = `googtrans=/en/${lang}; path=/;`;
        document.cookie = `googtrans=/en/${lang}; path=/; domain=${domain};`;
        if (domain.includes(".")) {
          document.cookie = `googtrans=/en/${lang}; path=/; domain=.${domain};`;
        }

        const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
        if (combo) {
          combo.value = lang;
          combo.dispatchEvent(new Event("change"));
        }
      } catch (err) {
        console.warn("Could not trigger Google Translate element:", err);
      }
    }

    function handleLanguageChange(e: Event) {
      const targetLang = (e as CustomEvent).detail;
      if (targetLang === "hi" || targetLang === "en") {
        triggerGoogleTranslate(targetLang);
      }
    }

    window.addEventListener("mppiti-language-change", handleLanguageChange);
    return () => window.removeEventListener("mppiti-language-change", handleLanguageChange);
  }, []);

  return (
    <>
      <div id="google_translate_element" style={{ display: "none" }} />
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
