"use client";

import React from "react";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";
import { Brain, Sparkles, ShieldCheck } from "lucide-react";

interface AssessmentCompanionProps {
  currentStep: number;
  emotion: string;
  submitting?: boolean;
}

export function AssessmentCompanion({
  currentStep,
  emotion,
  submitting = false,
}: AssessmentCompanionProps) {

  const getStepGuidance = () => {
    if (submitting) return "Calculating PHQ-9, GAD-7, and clinical risk metrics via watsonx Granite...";
    
    switch (currentStep) {
      case 1:
        return "Demographic context helps personalize baseline scoring benchmarks.";
      case 2:
        return "PHQ-9 items evaluate emotional regulation and energy balance over the last two weeks.";
      case 3:
        return "GAD-7 items measure anxiety responses and cognitive worry patterns.";
      case 4:
        return "Stress perception and sleep hygiene strongly correlate with emotional resilience.";
      case 5:
        return "Self-rated wellbeing metrics complete your holistic clinical profile.";
      default:
        return "Answer naturally based on how you have felt over recent weeks.";
    }
  };

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 backdrop-blur-3xl shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Clinical AI Companion
          </h3>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Confidential
        </span>
      </div>

      {/* Shared AIPresenceOrb */}
      <div className="flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl relative overflow-hidden text-center space-y-3">
        <AIPresenceOrb
          size="sm"
          state={submitting ? "thinking" : "idle"}
          emotion={emotion}
          showOuterRing={true}
          interactive={true}
        />
        <div>
          <p className="text-xs font-bold text-white">watsonx Clinical Engine</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {submitting ? "Processing clinical payload..." : `Attuned to ${emotion}`}
          </p>
        </div>
      </div>

      {/* Real-time Guidance */}
      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Supportive Note</span>
        </div>
        <p className="text-xs text-slate-300 italic leading-relaxed">
          &quot;{getStepGuidance()}&quot;
        </p>
      </div>

      {/* Privacy Guarantee */}
      <div className="p-3.5 rounded-2xl bg-accent/10 border border-accent/20 text-xs text-slate-300 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-accent">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <span>Clinical Privacy</span>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-400">
          Your responses are processed locally and securely encrypted. No judgmental scoring is performed.
        </p>
      </div>
    </div>
  );
}
