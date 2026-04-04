import { create } from "zustand";

type Theme = "dark" | "light" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("k-gun-theme");
  if (stored === "dark" || stored === "light" || stored === "system") {
    return stored;
  }
  return "dark";
}

function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && systemDark);

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getStoredTheme(),
  setTheme: (theme) => {
    localStorage.setItem("k-gun-theme", theme);
    applyTheme(theme);
    set({ theme });
  },
}));

/** Call once on mount to sync DOM with persisted preference */
export function initializeTheme() {
  const theme = useThemeStore.getState().theme;
  applyTheme(theme);

  // Listen for system preference changes when in "system" mode
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    const current = useThemeStore.getState().theme;
    if (current === "system") {
      applyTheme("system");
    }
  };
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}
