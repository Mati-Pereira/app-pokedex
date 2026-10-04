import { createContext, createElement, ReactNode, useContext, useEffect, useState } from 'react';
import { isLanguage, Language } from '../lib/i18n';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'pt-BR',
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setCurrentLanguage] = useState<Language>('pt-BR');

  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem('language');
      if (isLanguage(storedLanguage)) setCurrentLanguage(storedLanguage);
    } catch {
      // Portuguese remains the default when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (nextLanguage: Language) => {
    setCurrentLanguage(nextLanguage);
    try {
      localStorage.setItem('language', nextLanguage);
    } catch {
      // The language still changes for the current session.
    }
  };

  return createElement(LanguageContext.Provider, { value: { language, setLanguage } }, children);
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
