export type Theme = "light" | "dark";

const STORAGE_KEY = "portsync_theme";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (saved === "light" || saved === "dark") return saved;
  // User explicitly asked for a bright theme
  return "light";
}

export function setThemeInStorage(theme: Theme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, theme);
}
