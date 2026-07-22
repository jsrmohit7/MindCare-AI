"use client";

import React from "react";
import { Sparkles, Calendar, Flame, Award, Heart, CheckCircle2 } from "lucide-react";

interface CheckInHeroProps {
  emotion: string;
  streakDays: number;
  existingRecord: boolean;
  scorePreview?: number;
  motivationSnippet?: string;
}

export function CheckInHero({
  emotion,
  streakDays,
  existingRecord,
  scorePreview = 85,
  motivationSnippet = "Consistency in emotional awareness creates long-term resilience.",
}: CheckInHeroProps) {
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 sm:p-8 backdrop-blur-3xl shadow-2xl overflow-hidden animate-fadeInUp">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 h-64 w-64 bg-accent/10 blur-3xl rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 h-48 w-48 bg-purple-500/10 blur-2xl rounded-full -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Column: Greeting, Date & Emotion Status */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <Calendar className="h-3.5 w-3.5 text-accent" />
            <span>{formattedDate}</span>
            {existingRecord && (
              <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Logged Today
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Emotion Calibration
            <span className="text-xs px-3 py-1 rounded-full bg-accent/20 text-accent border border-accent/30 font-bold uppercase tracking-wider">
              {emotion}
            </span>
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            &quot;{motivationSnippet}&quot;
          </p>

          <div className="pt-1 flex items-center gap-2 text-[10px] font-semibold text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Powered by IBM watsonx Granite AI</span>
          </div>
        </div>

        {/* Right Column: Live Vitals */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          
          {/* Consistency Streak */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Streak</span>
              <Flame className="h-4 w-4 text-amber-400 animate-pulse" />
            </div>
            <p className="text-2xl font-black text-white">{streakDays} <span className="text-xs font-bold text-slate-400">days</span></p>
            <p className="text-[9px] text-slate-500 font-semibold">Active consistency</p>
          </div>

          {/* Wellness Score Preview */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Vitals Score</span>
              <Award className="h-4 w-4 text-accent" />
            </div>
            <p className="text-2xl font-black text-accent">{scorePreview} <span className="text-xs font-bold text-slate-400">/ 100</span></p>
            <p className="text-[9px] text-slate-500 font-semibold">Target wellness</p>
          </div>

          {/* Calibration Notice */}
          <div className="col-span-2 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md flex items-center gap-2.5 text-[11px] text-slate-300">
            <Heart className="h-4 w-4 text-rose-400 shrink-0" />
            <span>Checking in daily fine-tunes your AI Coach & Dashboard vitals.</span>
          </div>

        </div>

      </div>
    </div>
  );
}
