"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";

export interface HistoryEntry {
  date: string;
  detected_emotion: string;
  theme: string;
}

export interface EmotionContextType {
  detectedEmotion: string;
  theme: string;
  overrideTheme: string | null;
  explanation: string;
  advice: string;
  motivation: string;
  showSupportRecommendation: boolean;
  history: HistoryEntry[];
  isLoading: boolean;
  setManualThemeOverride: (theme: string | null) => Promise<void>;
  refreshEmotionState: () => Promise<void>;
}

const EmotionContext = createContext<EmotionContextType | undefined>(undefined);

export function EmotionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const [detectedEmotion, setDetectedEmotion] = useState<string>("Calm");
  const [theme, setTheme] = useState<string>("calm");
  const [overrideTheme, setOverrideTheme] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [advice, setAdvice] = useState<string>("");
  const [motivation, setMotivation] = useState<string>("");
  const [showSupportRecommendation, setShowSupportRecommendation] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshEmotionState = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await api.get("/adaptive-theme");
      const data = response.data;
      
      setDetectedEmotion(data.detected_emotion || "Calm");
      setTheme(data.theme || "calm");
      setOverrideTheme(data.override_theme || null);
      setExplanation(data.explanation || "");
      setAdvice(data.advice || "");
      setMotivation(data.motivation || "");
      setShowSupportRecommendation(!!data.show_support_recommendation);
      setHistory(data.history || []);
    } catch (error) {
      console.error("Failed to load adaptive theme state:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const setManualThemeOverride = useCallback(async (selectedTheme: string | null) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await api.post("/adaptive-theme/override", { theme: selectedTheme });
      const data = response.data;
      
      setDetectedEmotion(data.detected_emotion || "Calm");
      setTheme(data.theme || "calm");
      setOverrideTheme(data.override_theme || null);
      setExplanation(data.explanation || "");
      setAdvice(data.advice || "");
      setMotivation(data.motivation || "");
      setShowSupportRecommendation(!!data.show_support_recommendation);
      setHistory(data.history || []);
    } catch (error) {
      console.error("Failed to set theme override:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load state when user logs in
  useEffect(() => {
    if (user) {
      refreshEmotionState();
    } else {
      // Clear state on logout
      setDetectedEmotion("Calm");
      setTheme("calm");
      setOverrideTheme(null);
      setExplanation("");
      setAdvice("");
      setMotivation("");
      setShowSupportRecommendation(false);
      setHistory([]);
    }
  }, [user, refreshEmotionState]);

  const activeTheme = overrideTheme || theme;

  return (
    <EmotionContext.Provider
      value={{
        detectedEmotion,
        theme: activeTheme,
        overrideTheme,
        explanation,
        advice,
        motivation,
        showSupportRecommendation,
        history,
        isLoading,
        setManualThemeOverride,
        refreshEmotionState,
      }}
    >
      {children}
    </EmotionContext.Provider>
  );
}

export function useEmotion() {
  const context = useContext(EmotionContext);
  if (context === undefined) {
    throw new Error("useEmotion must be used within an EmotionProvider");
  }
  return context;
}
