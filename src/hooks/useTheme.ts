// hooks/useTheme.ts

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectThemeMode, toggleTheme, setThemeMode } from "@/store/slices/themeSlice";

export function useTheme() {
  const dispatch = useAppDispatch();
  const mode     = useAppSelector(selectThemeMode);

  // Sync the Tailwind dark class with Redux mode
  useEffect(() => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [mode]);

  const toggle      = useCallback(() => dispatch(toggleTheme()),             [dispatch]);
  const setMode     = useCallback((m: "light" | "dark") => dispatch(setThemeMode(m)), [dispatch]);

  return { mode, toggle, setMode, isDark: mode === "dark" };
}
