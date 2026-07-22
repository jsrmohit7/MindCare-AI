"use client";

import React from "react";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";
import { Brain, Sparkles, ShieldCheck } from "lucide-react";

interface CheckInCompanionProps {
  currentStep: number;
  mood: string;
  stress: number;
  anxiety: number;
  submitting?: boolean;
}

export function CheckInCompanion({
  currentStep,
  mood,
  stress,
  anxiety,
  submitting = false,
}: CheckInCompanionProps) {

  // Dynamic context tips based on active step and vitals
  const getStepGuidance = () => {
    if (submitting) return "Calibrating emotional baseline with IBM watsonx Granite...";
    
    switch (currentStep) {
      case 1:
        return `Attuned to your selected state (${mood}). This anchors your daily wellness vitals.`;
      case 2:
        if (stress > 7 || anxiety > 7) {
          return "High stress/anxiety detected. Your AI Coach will recommend calming box breathing exercises.";
        }
        return "Tracking stress and anxiety helps fine-tune your personal resilience threshold.";
      case 3:
        return "Sleep quality and hydration are vital baseline indicators for emotional stability.";
      case 4:
        return "Physical exercise and mindfulness practices significantly lower baseline cortisol.";
      case 5:
        return "Reflective journaling consolidates emotional patterns and generates Granite insights.";
      default:
        return "Daily check-ins personalize your Dashboard, AI Coach, and Journal experiences.";
    }
  };

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 backdrop-blur-3xl shadow-2xl space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            AI Calibration Companion
          </h3>
        </div>
        <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Live Sync
        </span>
      </div>

      {/* Shared AIPresenceOrb */}
      <div className="flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl relative overflow-hidden text-center space-y-3">
        <AIPresenceOrb
          size="sm"
          state={submitting ? "thinking" : "idle"}
          emotion={mood}
          showOuterRing={true}
          interactive={true}
        />
        <div>
          <p className="text-xs font-bold text-white">watsonx Granite Engine</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {submitting ? "Processing emotional profile..." : `Attuned to ${mood}`}
          </p>
        </div>
      </div>

      {/* Real-time Guidance */}
      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Real-Time Insight</span>
        </div>
        <p className="text-xs text-slate-300 italic leading-relaxed">
          &quot;{getStepGuidance()}&quot;
        </p>
      </div>

      {/* Emotion Synchronization Notice */}
      <div className="p-3.5 rounded-2xl bg-accent/10 border border-accent/20 text-xs text-slate-300 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-accent">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <span>Platform Synchronization</span>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-400">
          Completing this calibration updates your baseline across the Dashboard, AI Coach, and Journal.
        </p>
      </div>

    </div>
  );
}
