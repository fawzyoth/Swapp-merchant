import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getTranslation, getDirection, TranslationKey } from '../lib/i18n';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('clientLanguage');
    return (saved === 'ar' || saved === 'fr') ? saved : 'fr';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('clientLanguage', newLang);
  };

  const t = (key: TranslationKey) => getTranslation(lang, key);
  const dir = getDirection(lang);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
