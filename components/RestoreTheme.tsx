"use client";

/**
 * RestoreTheme — re-applies the persisted theme attribute on error pages.
 *
 * Next.js re-renders the document for not-found/error boundaries and wipes
 * the html attributes the pre-paint script set (verified in prod: the home
 * keeps data-foues-theme after hydration, the 404 loses it). This effect
 * runs after that wipe and puts the attribute back. ErrorScreen also inlines
 * the pre-paint script for the first paint; this covers the post-hydration
 * window.
 */

import { useEffect } from "react";

export function RestoreTheme() {
  useEffect(() => {
    try {
      if (localStorage.getItem("foues-theme") === "dark") {
        document.documentElement.dataset.fouesTheme = "dark";
      } else {
        delete document.documentElement.dataset.fouesTheme;
      }
    } catch {
      // private browsing / storage denied — leave the default theme
    }
  }, []);

  return null;
}
