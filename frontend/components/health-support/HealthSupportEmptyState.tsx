"use client";

import React from "react";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";
import { Compass, RefreshCw } from "lucide-react";

interface HealthSupportEmptyStateProps {
  emotion: string;
  onResetFilter: () => void;
}

export function HealthSupportEmptyState({
  emotion,
  onResetFilter,
}: HealthSupportEmptyStateProps) {
  return (
    <div className="py-12 px-6 rounded-3xl border border-white/[0.08] bg-slate-950/40 backdrop-blur-3xl shadow-2xl flex flex-col items-center justify-center text-center space-y-6 animate-fadeInUp">
      <div className="relative">
        <AIPresenceOrb size="lg" emotion={emotion} showOuterRing={true} interactive={true} />
        <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-3xl -z-10 animate-pulse" />
      </div>

      <div className="max-w-md space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
          <Compass className="h-3.5 w-3.5" />
          <span>Care Category Explorer</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          No Resources Found in Selected Category
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Try clearing your filter to view all available clinical support options and self-care resources.
        </p>
      </div>

      <button
        onClick={onResetFilter}
        className="p-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 border border-emerald-400 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
      >
        <RefreshCw className="h-4 w-4" />
        <span>View All Support Options</span>
      </button>
    </div>
  );
}
