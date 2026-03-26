import { create } from "zustand";

const THEMES = {
  dark: {
    name: "Dark",
    bg: "bg-gray-950",
    nav: "bg-gray-900 border-gray-800",
    card: "bg-gray-900 border-gray-800",
    text: "text-white",
    sub: "text-gray-400",
    html: "dark",
  },
  light: {
    name: "Light",
    bg: "bg-gray-50",
    nav: "bg-white border-gray-200",
    card: "bg-white border-gray-200",
    text: "text-gray-900",
    sub: "text-gray-500",
    html: "light",
  },
  midnight: {
    name: "Midnight",
    bg: "bg-slate-950",
    nav: "bg-slate-900 border-slate-800",
    card: "bg-slate-900 border-slate-800",
    text: "text-white",
    sub: "text-slate-400",
    html: "dark",
  },
};

const saved = localStorage.getItem("theme") || "dark";

function applyTheme(key) {
  const t = THEMES[key] || THEMES.dark;
  const root = document.documentElement;
  // Remove all theme classes then apply new one
  root.classList.remove("dark", "light");
  root.classList.add(t.html);
  // Store CSS vars for dynamic use
  root.setAttribute("data-theme", key);
}

applyTheme(saved);

export const useThemeStore = create((set) => ({
  theme: saved,
  themes: THEMES,
  setTheme: (key) => {
    localStorage.setItem("theme", key);
    applyTheme(key);
    set({ theme: key });
  },
}));
