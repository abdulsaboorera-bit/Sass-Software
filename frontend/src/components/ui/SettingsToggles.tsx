"use client";

import { Sun, Moon, Languages } from "lucide-react";
import { useAppSettings } from "@/components/providers/AppSettings";

export default function SettingsToggles({ className = "", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const { theme, locale, toggleTheme, toggleLocale } = useAppSettings();
  const btn =
    tone === "dark"
      ? "p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
      : "p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent";
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <button onClick={toggleLocale} className={btn} title={locale === "ur" ? "Switch to English" : "اردو میں دیکھیں"} aria-label="Toggle language">
        <Languages size={18} />
      </button>
      <button onClick={toggleTheme} className={btn} title={theme === "dark" ? "Light mode" : "Dark mode"} aria-label="Toggle theme">
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}
