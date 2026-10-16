"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type Locale = "en" | "ur";

interface AppSettingsValue {
  theme: Theme;
  locale: Locale;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  toggleLocale: () => void;
  setLocale: (l: Locale) => void;
}

const AppSettingsContext = createContext<AppSettingsValue | null>(null);

const THEME_KEY = "nexus-theme";
const LOCALE_KEY = "nexus-locale";

export function applySettings(theme: Theme, locale: Locale) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.setAttribute("lang", locale === "ur" ? "ur" : "en");
  root.setAttribute("dir", locale === "ur" ? "rtl" : "ltr");
  root.classList.toggle("dark", theme === "dark");
}

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const storedTheme = (localStorage.getItem(THEME_KEY) as Theme) || "light";
    const storedLocale = (localStorage.getItem(LOCALE_KEY) as Locale) || "en";
    setThemeState(storedTheme);
    setLocaleState(storedLocale);
    applySettings(storedTheme, storedLocale);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    applySettings(t, (localStorage.getItem(LOCALE_KEY) as Locale) || "en");
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(LOCALE_KEY, l);
    applySettings((localStorage.getItem(THEME_KEY) as Theme) || "light", l);
  }, []);

  const toggleTheme = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);
  const toggleLocale = useCallback(() => setLocale(locale === "ur" ? "en" : "ur"), [locale, setLocale]);

  return (
    <AppSettingsContext.Provider value={{ theme, locale, toggleTheme, setTheme, toggleLocale, setLocale }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used within AppSettingsProvider");
  return ctx;
}

/** Inline script string to apply the stored theme before first paint (avoids flash). */
export const settingsInitScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}')||'light';var l=localStorage.getItem('${LOCALE_KEY}')||'en';var r=document.documentElement;r.setAttribute('data-theme',t);r.setAttribute('lang',l==='ur'?'ur':'en');r.setAttribute('dir',l==='ur'?'rtl':'ltr');if(t==='dark')r.classList.add('dark');}catch(e){}})();`;
