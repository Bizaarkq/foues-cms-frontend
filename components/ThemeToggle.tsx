"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * ThemeToggle — floating client button that flips the dark palette.
 *
 * Toggles `data-foues-theme` on `<html>` and persists the choice in
 * localStorage (`foues-theme`). On mount it reconciles state with the
 * attribute the pre-paint script already set, so there is no flash and no
 * hydration mismatch (the icon is client-only post-mount). localStorage access
 * is wrapped in try/catch for SSR / private-browsing safety.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.dataset.fouesTheme === "dark");
  }, []);

  const toggle = () => {
    const next = !isDark;
    if (next) {
      document.documentElement.dataset.fouesTheme = "dark";
    } else {
      delete document.documentElement.dataset.fouesTheme;
    }
    try {
      localStorage.setItem("foues-theme", next ? "dark" : "light");
    } catch {
      // localStorage unavailable (private browsing / SSR) — ignore.
    }
    setIsDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className="fixed bottom-20 right-4 z-50 rounded-full p-3 shadow-lg bg-[var(--color-foues-surface-raised)] text-[var(--color-foues-text-base)] md:bottom-4"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
