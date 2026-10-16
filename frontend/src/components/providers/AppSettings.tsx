"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface AppSettingsValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const AppSettingsContext = createContext<AppSettingsValue | null>(null);

const THEME_KEY = "nexus-theme";
const LEGACY_LOCALE_KEY = "nexus-locale";

export function applySettings(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme === "dark");
}

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const storedTheme = (localStorage.getItem(THEME_KEY) as Theme) || "light";
    localStorage.removeItem(LEGACY_LOCALE_KEY);
    document.documentElement.removeAttribute("dir");
    setThemeState(storedTheme);
    applySettings(storedTheme);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    applySettings(t);
  }, []);

  const toggleTheme = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  return (
    <AppSettingsContext.Provider value={{ theme, toggleTheme, setTheme }}>
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
export const settingsInitScript = `(function(){try{localStorage.removeItem('${LEGACY_LOCALE_KEY}');var t=localStorage.getItem('${THEME_KEY}')||'light';var r=document.documentElement;r.removeAttribute('dir');r.setAttribute('lang','en');r.setAttribute('data-theme',t);if(t==='dark')r.classList.add('dark');}catch(e){}})();`;
