"use client";

import React from "react";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";
import { Brain, Sparkles, ShieldCheck } from "lucide-react";

interface HealthCompanionProps {
  emotion: string;
  activeCategory?: string;
}

export function HealthCompanion({ emotion }: HealthCompanionProps) {

  const getCompanionAdvice = () => {
    switch (emotion) {
      case "Stressed":
      case "Anxious":
        return "I recommend starting with guided box breathing or reaching out to confidential crisis lines if you feel overwhelmed.";
      case "Calm":
        return "You are in a balanced state. Great time to explore educational guides or log daily reflections in your Journal.";
      case "Happy":
        return "Celebrate your current emotional balance! Keep maintaining healthy sleep and exercise routines.";
      case "Low Mood":
        return "Take small, gentle steps today. Reaching out to trusted friends or exploring support resources can help.";
      default:
        return "Exploring support options helps build resilience before challenging moments arise.";
    }
  };

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 backdrop-blur-3xl shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Care AI Navigator
          </h3>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Live Sync
        </span>
      </div>

      {/* Shared AIPresenceOrb */}
      <div className="flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-center space-y-3 relative overflow-hidden">
        <AIPresenceOrb size="sm" emotion={emotion} showOuterRing={true} interactive={true} />
        <div>
          <p className="text-xs font-bold text-white">watsonx Navigation Engine</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Attuned to {emotion} baseline
          </p>
        </div>
      </div>

      {/* Real-time Guidance */}
      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Care Navigation Insight</span>
        </div>
        <p className="text-xs text-slate-300 italic leading-relaxed">
          &quot;{getCompanionAdvice()}&quot;
        </p>
      </div>

      {/* Assurance Note */}
      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Care Guidance</span>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-400">
          MindCare AI provides guidance to help you navigate appropriate wellness and clinical care resources.
        </p>
      </div>
    </div>
  );
}
