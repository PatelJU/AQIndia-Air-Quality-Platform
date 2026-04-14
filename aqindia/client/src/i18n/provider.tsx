import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, DEFAULT_LANGUAGE, loadTranslations, translate, formatNumber, formatDate } from './config';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  formatNum: (value: number) => string;
  formatDate: (date: Date) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export function LanguageProvider({ children, defaultLanguage = DEFAULT_LANGUAGE }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('aqindia_language');
    return (saved as Language) || defaultLanguage;
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    loadTranslations(language)
      .then(() => {
        localStorage.setItem('aqindia_language', language);
        setIsLoading(false);
      })
      .catch(() => {
        console.error('[i18n] Failed to load translations');
        setIsLoading(false);
      });
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, fallback?: string) => {
    return translate(key, language, fallback);
  };

  const formatNum = (value: number) => {
    return formatNumber(value, language);
  };

  const formatDateLocalized = (date: Date) => {
    return formatDate(date, language);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    formatNum,
    formatDate: formatDateLocalized,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  
  if (!context) {
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: (key: string, fallback?: string) => fallback || key,
      formatNum: (value: number) => value.toString(),
      formatDate: (date: Date) => date.toLocaleDateString(),
      isLoading: false,
    };
  }
  
  return context;
}
