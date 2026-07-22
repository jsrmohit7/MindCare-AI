"use client";

import React, { useEffect } from "react";
import { useEmotion } from "@/context/EmotionContext";

export function AdaptiveThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useEmotion();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const body = document.body;
      const themeClasses = [
        "theme-happy",
        "theme-calm",
        "theme-focused",
        "theme-stressed",
        "theme-anxious",
        "theme-low_mood",
      ];

      // Remove any previously set theme class to avoid style conflicts
      themeClasses.forEach((cls) => body.classList.remove(cls));

      // Append active emotional state class
      body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return <>{children}</>;
}
