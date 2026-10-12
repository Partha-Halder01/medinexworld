"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import en from '@/lib/i18n/en.json';
import hi from '@/lib/i18n/hi.json';

export type Locale = 'en' | 'hi';

type TranslationDict = Record<string, any>;

const dictionaries: Record<Locale, TranslationDict> = { en, hi };

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    // Ensure English is default and purge any old Hindi language selection
    try {
      localStorage.removeItem('medinex_locale');
      localStorage.removeItem('nbms_locale');
      localStorage.removeItem('upcharpath_locale');
    } catch {}
    setLocaleState('en');
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'en';
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('medinex_locale', newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback((key: string): string => {
    return getNestedValue(dictionaries[locale] as unknown as Record<string, unknown>, key);
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
