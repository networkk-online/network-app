import { useEffect, useState, useCallback } from 'react';

export type AppLang = 'ar' | 'en';

const KEY = 'app_language';

const readLang = (): AppLang => {
  if (typeof window === 'undefined') return 'ar';
  const v = localStorage.getItem(KEY);
  return v === 'en' ? 'en' : 'ar';
};

const applyLang = (lang: AppLang) => {
  const html = document.documentElement;
  html.setAttribute('lang', lang);
  html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
};

export const useAppLanguage = () => {
  const [lang, setLangState] = useState<AppLang>(readLang);

  useEffect(() => {
    applyLang(lang);
  }, [lang]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setLangState(readLang());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setLang = useCallback((l: AppLang) => {
    localStorage.setItem(KEY, l);
    setLangState(l);
    applyLang(l);
  }, []);

  const t = useCallback(
    <T extends { ar: string; en: string }>(pair: T) => pair[lang],
    [lang]
  );

  return { lang, setLang, t, dir: lang === 'ar' ? 'rtl' : 'ltr', isRTL: lang === 'ar' };
};
