"use client";

import React from "react";
import { HeartPulse, Calendar, ShieldCheck, Sparkles, PhoneCall } from "lucide-react";

interface HealthSupportHeroProps {
  emotion: string;
  scorePreview?: number;
  motivationSnippet?: string;
  availabilityStatus?: string;
}

export function HealthSupportHero({
  emotion,
  scorePreview = 86,
  motivationSnippet = "Seeking support is an essential, courageous part of maintaining emotional well-being.",
  availabilityStatus = "24/7 Support Available",
}: HealthSupportHeroProps) {
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 sm:p-8 backdrop-blur-3xl shadow-2xl overflow-hidden animate-fadeInUp">
      {/* Ambient background lighting glow */}
      <div className="absolute top-0 right-0 h-64 w-64 bg-emerald-500/10 blur-3xl rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 h-48 w-48 bg-accent/10 blur-2xl rounded-full -z-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Column: Greeting, Date & Emotional Baseline */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            <span>{formattedDate}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Intelligent Care Navigator
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider">
              {emotion} Baseline
            </span>
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            &quot;{motivationSnippet}&quot;
          </p>

          <div className="pt-1 flex items-center gap-2 text-[10px] font-semibold text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Guided by IBM watsonx Granite Care Navigator</span>
          </div>
        </div>

        {/* Right Column: Key Status Vitals */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Care Network</span>
              <HeartPulse className="h-4 w-4 text-emerald-400 animate-pulse" />
            </div>
            <p className="text-base font-bold text-emerald-400 pt-1">{availabilityStatus}</p>
            <p className="text-[9px] text-slate-500 font-semibold">Verified directory</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Vitals Index</span>
              <ShieldCheck className="h-4 w-4 text-accent" />
            </div>
            <p className="text-2xl font-black text-white">{scorePreview} / 100</p>
            <p className="text-[9px] text-slate-500 font-semibold">Current baseline</p>
          </div>

          <div className="col-span-2 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md flex items-center justify-between text-[11px] text-emerald-300">
            <span className="flex items-center gap-2 font-bold">
              <PhoneCall className="h-4 w-4 text-emerald-400" /> Immediate Helpline: Dial 988
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              Toll-Free 24/7
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
