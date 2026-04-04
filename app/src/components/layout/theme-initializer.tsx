"use client";

import { useEffect } from "react";
import { initializeTheme } from "@/stores/theme";

export function ThemeInitializer() {
  useEffect(() => {
    const cleanup = initializeTheme();
    return cleanup;
  }, []);

  return null;
}
