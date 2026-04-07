import { createContext, useContext, useState, useEffect } from "react";
import type { Theme } from "@/lib/theme";
import { getStoredTheme, applyTheme, toggleTheme } from "@/lib/theme";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = getStoredTheme();
    applyTheme(stored);
    return stored;
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = () => setTheme((t) => toggleTheme(t));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
