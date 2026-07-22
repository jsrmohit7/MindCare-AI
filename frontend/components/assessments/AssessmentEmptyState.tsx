"use client";

import React from "react";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";
import { Activity, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

interface AssessmentEmptyStateProps {
  emotion: string;
  onStartAssessment: () => void;
}

export function AssessmentEmptyState({
  emotion,
  onStartAssessment,
}: AssessmentEmptyStateProps) {
  return (
    <div className="py-12 px-6 rounded-3xl border border-white/[0.08] bg-slate-950/40 backdrop-blur-3xl shadow-2xl flex flex-col items-center justify-center text-center space-y-6 animate-fadeInUp">
      <div className="relative">
        <AIPresenceOrb size="lg" emotion={emotion} showOuterRing={true} interactive={true} />
        <div className="absolute inset-0 bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse" />
      </div>

      <div className="max-w-md space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-[10px] font-bold uppercase tracking-wider">
          <Activity className="h-3.5 w-3.5" />
          <span>Clinical Baseline Evaluation</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Calibrate Your Clinical Wellness Profile
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Complete a confidential standardized assessment (PHQ-9 & GAD-7 scales). IBM watsonx Granite generates personalized insights and clinical baseline scores.
        </p>
      </div>

      <button
        onClick={onStartAssessment}
        className="p-3.5 px-6 rounded-2xl bg-accent hover:bg-accent/90 border border-accent/40 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-accent/20 active:scale-95"
      >
        <Sparkles className="h-4 w-4" />
        <span>Begin Clinical Assessment</span>
        <ArrowRight className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold pt-2">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        <span>100% Confidential & Secure Encryption</span>
      </div>
    </div>
  );
}
