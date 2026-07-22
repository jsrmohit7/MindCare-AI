"use client";

import React from "react";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";
import { WellnessGoal } from "@/services/goals";
import { Brain, Check } from "lucide-react";

interface GoalCompanionProps {
  emotion: string;
  suggestedGoals: WellnessGoal[];
  loadingSuggestions: boolean;
  onAdoptSuggested: (suggested: WellnessGoal) => void;
}

export function GoalCompanion({
  emotion,
  suggestedGoals,
  loadingSuggestions,
  onAdoptSuggested,
}: GoalCompanionProps) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 backdrop-blur-3xl shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            AI Goal Coach
          </h3>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
          watsonx Granite
        </span>
      </div>

      {/* Shared AIPresenceOrb */}
      <div className="flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-center space-y-3 relative overflow-hidden">
        <AIPresenceOrb size="sm" emotion={emotion} showOuterRing={true} interactive={true} />
        <div>
          <p className="text-xs font-bold text-white">Habit Alignment Engine</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Optimized for {emotion} baseline
          </p>
        </div>
      </div>

      {/* AI Suggested Goals Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Recommended Objectives
          </span>
          <span className="text-[9px] text-purple-400 font-bold">Smart AI</span>
        </div>

        {loadingSuggestions ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-white/[0.02] animate-pulse border border-white/[0.04]" />
            ))}
          </div>
        ) : suggestedGoals.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-center space-y-1">
            <p className="text-xs text-slate-400 font-semibold">Your objectives are balanced!</p>
            <p className="text-[10px] text-slate-500">Log more check-ins to unlock new AI suggestions.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {suggestedGoals.map((suggested, index) => (
              <div key={index} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-accent/30 space-y-2 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-white">{suggested.title}</p>
                  <span className="text-[9px] font-bold text-accent uppercase px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30">
                    {suggested.type}
                  </span>
                </div>
                {suggested.reason && (
                  <p className="text-[10px] text-slate-400 italic leading-snug">&quot;{suggested.reason}&quot;</p>
                )}
                <button
                  onClick={() => onAdoptSuggested(suggested)}
                  className="w-full flex items-center justify-center gap-1.5 bg-accent/15 hover:bg-accent text-accent hover:text-white border border-accent/30 font-bold text-[10px] py-1.5 rounded-xl transition-all active:scale-95"
                >
                  <Check className="h-3 w-3" /> Adopt Goal
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
