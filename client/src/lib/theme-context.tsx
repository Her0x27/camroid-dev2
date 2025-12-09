import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { themeRegistry, applyTheme } from "@/themes";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  themeId: string;
  setTheme: (theme: ThemeMode) => void;
  setThemeById: (themeId: string) => void;
  toggleTheme: () => void;
  availableThemes: { id: string; name: string; mode: ThemeMode }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_DARK_THEME = "tactical-dark";
const DEFAULT_LIGHT_THEME = "tactical-light";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>(() => {
    const saved = localStorage.getItem("themeId");
    if (saved && themeRegistry.get(saved)) {
      return saved;
    }
    const savedMode = localStorage.getItem("theme") as ThemeMode | null;
    return savedMode === "light" ? DEFAULT_LIGHT_THEME : DEFAULT_DARK_THEME;
  });

  const currentTheme = themeRegistry.get(themeId);
  const theme: ThemeMode = currentTheme?.mode || "dark";

  useEffect(() => {
    const themeConfig = themeRegistry.get(themeId);
    if (themeConfig) {
      applyTheme(themeConfig);
      localStorage.setItem("themeId", themeId);
      localStorage.setItem("theme", themeConfig.mode);
    }
  }, [themeId]);

  const setTheme = (newTheme: ThemeMode) => {
    const newThemeId = newTheme === "light" ? DEFAULT_LIGHT_THEME : DEFAULT_DARK_THEME;
    setThemeIdState(newThemeId);
  };

  const setThemeById = (newThemeId: string) => {
    if (themeRegistry.get(newThemeId)) {
      setThemeIdState(newThemeId);
    }
  };

  const toggleTheme = () => {
    const newThemeId = theme === "dark" ? DEFAULT_LIGHT_THEME : DEFAULT_DARK_THEME;
    setThemeIdState(newThemeId);
  };

  const availableThemes = themeRegistry.getAll().map((t) => ({
    id: t.id,
    name: t.name,
    mode: t.mode,
  }));

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme, setThemeById, toggleTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
