import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LANGUAGES = {
  fr: { code: 'fr', label: 'FR', name: 'Français', dir: 'ltr' },
  en: { code: 'en', label: 'EN', name: 'English',  dir: 'ltr' },
  ar: { code: 'ar', label: 'AR', name: 'العربية',  dir: 'rtl' },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('hmk_lang') || 'fr';
  });

  // Met à jour l'attribut dir et lang du document HTML
  useEffect(() => {
    const { dir } = LANGUAGES[lang] || LANGUAGES.fr;
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
    localStorage.setItem('hmk_lang', lang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}