"use client";

import React from "react";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";
import { Target, Sparkles, ArrowRight } from "lucide-react";

interface GoalEmptyStateProps {
  emotion: string;
  onOpenCreateForm: () => void;
}

export function GoalEmptyState({ emotion, onOpenCreateForm }: GoalEmptyStateProps) {
  return (
    <div className="py-12 px-6 rounded-3xl border border-white/[0.08] bg-slate-950/40 backdrop-blur-3xl shadow-2xl flex flex-col items-center justify-center text-center space-y-6 animate-fadeInUp">
      <div className="relative">
        <AIPresenceOrb size="lg" emotion={emotion} showOuterRing={true} interactive={true} />
        <div className="absolute inset-0 bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse" />
      </div>

      <div className="max-w-md space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-[10px] font-bold uppercase tracking-wider">
          <Target className="h-3.5 w-3.5" />
          <span>Living Wellness Pathway</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Begin Your Personal Growth Pathway
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Set meaningful objectives attuned to your current state (<span className="text-accent font-semibold">{emotion}</span>). Small, consistent habits lead to lasting emotional balance.
        </p>
      </div>

      <button
        onClick={onOpenCreateForm}
        className="p-3.5 px-6 rounded-2xl bg-accent hover:bg-accent/90 border border-accent/40 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-accent/20 active:scale-95"
      >
        <Sparkles className="h-4 w-4" />
        <span>Create Your First Objective</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
