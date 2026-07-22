"use client";

import React from "react";
import { Sparkles, Calendar, BookOpen, Flame, Target } from "lucide-react";

interface JournalHeroProps {
  emotion: string;
  explanation?: string;
  totalEntries: number;
  streakDays: number;
  todayWordCount: number;
  writingGoal?: number; // default 200 words
}

export function JournalHero({
  emotion,
  explanation,
  totalEntries,
  streakDays,
  todayWordCount,
  writingGoal = 200,
}: JournalHeroProps) {
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const progressPercent = Math.min(100, Math.round((todayWordCount / writingGoal) * 100));

  return (
    <div className="relative rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 sm:p-8 backdrop-blur-3xl shadow-2xl overflow-hidden animate-fadeInUp">
      {/* Background ambient lighting glow */}
      <div className="absolute top-0 right-0 h-64 w-64 bg-accent/10 blur-3xl rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 h-48 w-48 bg-purple-500/10 blur-2xl rounded-full -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Column: Greeting, Date & Emotion */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <Calendar className="h-3.5 w-3.5 text-accent" />
            <span>{formattedDate}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Digital Wellness Journal
            <span className="text-xs px-3 py-1 rounded-full bg-accent/20 text-accent border border-accent/30 font-bold uppercase tracking-wider">
              {emotion} Baseline
            </span>
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            {explanation
              ? `"${explanation}"`
              : "Capture your thoughts, track your emotional evolution, and receive AI-driven reflections tailored to your state."}
          </p>

          <div className="pt-1 flex items-center gap-2 text-[10px] font-semibold text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Powered by IBM watsonx Granite AI</span>
          </div>
        </div>

        {/* Right Column: Live Stats & Goal Progress */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          
          {/* Total Entries */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Entries</span>
              <BookOpen className="h-4 w-4 text-accent" />
            </div>
            <p className="text-2xl font-black text-white">{totalEntries}</p>
            <p className="text-[9px] text-slate-500 font-semibold">Memories recorded</p>
          </div>

          {/* Streak */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Streak</span>
              <Flame className="h-4 w-4 text-amber-400 animate-pulse" />
            </div>
            <p className="text-2xl font-black text-white">{streakDays} <span className="text-xs font-bold text-slate-400">days</span></p>
            <p className="text-[9px] text-slate-500 font-semibold">Active consistency</p>
          </div>

          {/* Daily Writing Goal Progress */}
          <div className="col-span-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Target className="h-3.5 w-3.5 text-emerald-400" /> Today&apos;s Writing Goal
              </span>
              <span className="font-extrabold text-accent">
                {todayWordCount} / {writingGoal} words ({progressPercent}%)
              </span>
            </div>
            <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.04]">
              <div
                className="h-full bg-gradient-to-r from-accent to-purple-500 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
