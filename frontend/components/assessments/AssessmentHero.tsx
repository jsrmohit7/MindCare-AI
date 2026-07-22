"use client";

import React from "react";
import { Activity, Calendar, ShieldCheck, Sparkles, Award } from "lucide-react";

interface AssessmentHeroProps {
  emotion: string;
  totalAssessments: number;
  lastCompletionDate?: string;
  scorePreview?: number;
  motivationSnippet?: string;
}

export function AssessmentHero({
  emotion,
  totalAssessments,
  lastCompletionDate,
  scorePreview = 84,
  motivationSnippet = "Structured clinical evaluations provide reliable baselines for your emotional well-being.",
}: AssessmentHeroProps) {
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 sm:p-8 backdrop-blur-3xl shadow-2xl overflow-hidden animate-fadeInUp">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 h-64 w-64 bg-accent/10 blur-3xl rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 h-48 w-48 bg-indigo-500/10 blur-2xl rounded-full -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Column: Greeting, Date & Emotional Baseline */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <Calendar className="h-3.5 w-3.5 text-accent" />
            <span>{formattedDate}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Clinical Wellness Screening
            <span className="text-xs px-3 py-1 rounded-full bg-accent/20 text-accent border border-accent/30 font-bold uppercase tracking-wider">
              {emotion} Baseline
            </span>
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            &quot;{motivationSnippet}&quot;
          </p>

          <div className="pt-1 flex items-center gap-2 text-[10px] font-semibold text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Calibrated with IBM watsonx Granite Clinical Engine</span>
          </div>
        </div>

        {/* Right Column: Key Metrics */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
              <Activity className="h-4 w-4 text-accent" />
            </div>
            <p className="text-2xl font-black text-white">{totalAssessments}</p>
            <p className="text-[9px] text-slate-500 font-semibold">Total evaluations</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Clinical Vitals</span>
              <Award className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400">{scorePreview} / 100</p>
            <p className="text-[9px] text-slate-500 font-semibold">Wellness score index</p>
          </div>

          <div className="col-span-2 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md flex items-center justify-between text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Confidential & Encrypted
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              {lastCompletionDate ? `Last: ${new Date(lastCompletionDate).toLocaleDateString()}` : "Ready for initial evaluation"}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
