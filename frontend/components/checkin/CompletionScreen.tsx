"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Award, Sparkles, Bot, BookOpen, Target, LayoutDashboard, CheckCircle } from "lucide-react";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";

interface CompletionScreenProps {
  score: number;
  aiSummary?: string;
  motivation?: string;
  dailyGoal?: string;
  emotion: string;
  onClose: () => void;
}

export function CompletionScreen({
  score,
  aiSummary,
  motivation,
  dailyGoal,
  emotion,
  onClose,
}: CompletionScreenProps) {
  const [syncStep, setSyncStep] = useState(0);

  // Cinematic post-submission sequence steps
  useEffect(() => {
    const timers = [
      setTimeout(() => setSyncStep(1), 200),
      setTimeout(() => setSyncStep(2), 600),
      setTimeout(() => setSyncStep(3), 1000),
      setTimeout(() => setSyncStep(4), 1400),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl animate-fadeIn">
      <div className="w-full max-w-xl rounded-3xl border border-accent/30 bg-slate-900/90 p-6 sm:p-8 space-y-6 shadow-2xl relative text-center backdrop-blur-3xl overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute -top-12 -right-12 h-48 w-48 bg-accent/20 blur-3xl rounded-full -z-10 animate-pulse" />

        {/* Sync Progress Indicator */}
        {syncStep < 4 ? (
          <div className="py-12 space-y-6 animate-fadeIn">
            <AIPresenceOrb size="md" state="thinking" emotion={emotion} showOuterRing={true} />
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">
                {syncStep === 1 && "Submitting emotional vitals..."}
                {syncStep === 2 && "Analyzing emotional baseline with Granite..."}
                {syncStep === 3 && "Synchronizing Dashboard, AI Coach & Journal..."}
              </h3>
              <p className="text-xs text-slate-400">Please wait while your baseline calibrates</p>
            </div>
          </div>
        ) : (
          /* Final Completion View */
          <div className="space-y-6 animate-fadeInUp">
            {/* Header Badge */}
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20 border border-accent/40 text-accent shadow-xl shadow-accent/20">
                <Award className="h-8 w-8 animate-bounce" />
              </div>
            </div>

            {/* Score & Badge */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent">
                {emotion} Baseline Calibrated
              </span>
              <h3 className="text-xl font-extrabold text-white pt-2">Daily Check-In Complete</h3>
              <p className="text-xs text-slate-400">Your emotional vitals have been synchronized platform-wide.</p>
              
              <div className="pt-3">
                <span className="inline-flex items-center justify-center rounded-full bg-accent/10 px-5 py-2 border border-accent/30 shadow-inner">
                  <span className="text-2xl font-black text-accent">{score}</span>
                  <span className="text-xs text-slate-400 font-bold ml-1.5">/ 100 Wellness Score</span>
                </span>
              </div>
            </div>

            {/* AI Insights Card */}
            {aiSummary && (
              <div className="rounded-2xl border border-white/[0.06] bg-slate-950/60 p-4.5 text-left space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-accent uppercase tracking-wider">
                    <Sparkles className="h-4 w-4" />
                    <span>watsonx Granite Insights</span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Profile Updated
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed italic">
                  &ldquo;{aiSummary}&rdquo;
                </p>

                {motivation && (
                  <p className="text-[11px] text-accent font-medium pt-1">
                    &quot;{motivation}&quot;
                  </p>
                )}

                {dailyGoal && (
                  <div className="border-t border-white/[0.06] pt-2.5">
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block mb-0.5">
                      Recommended Focus
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed">{dailyGoal}</p>
                  </div>
                )}
              </div>
            )}

            {/* Platform Synchronization Animation Confirmation Bar */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-[10px] text-slate-400 font-medium flex items-center justify-around">
              <span className="flex items-center gap-1 text-accent font-bold">
                <LayoutDashboard className="h-3 w-3" /> Dashboard
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-accent font-bold">
                <Bot className="h-3 w-3" /> AI Coach
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-accent font-bold">
                <BookOpen className="h-3 w-3" /> Journal
              </span>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <Link
                href="/dashboard"
                onClick={onClose}
                className="p-3 rounded-xl bg-accent hover:bg-accent/90 border border-accent/40 text-white font-bold text-xs transition-all shadow-md shadow-accent/20 flex flex-col items-center justify-center space-y-1 col-span-2 sm:col-span-1"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/coach"
                onClick={onClose}
                className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-white font-bold text-xs transition-all flex flex-col items-center justify-center space-y-1"
              >
                <Bot className="h-4 w-4 text-accent" />
                <span>AI Coach</span>
              </Link>

              <Link
                href="/journal"
                onClick={onClose}
                className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-white font-bold text-xs transition-all flex flex-col items-center justify-center space-y-1"
              >
                <BookOpen className="h-4 w-4 text-accent" />
                <span>Journal</span>
              </Link>

              <Link
                href="/goals"
                onClick={onClose}
                className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-white font-bold text-xs transition-all flex flex-col items-center justify-center space-y-1"
              >
                <Target className="h-4 w-4 text-emerald-400" />
                <span>Goals</span>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
