"use client";

import React from "react";
import { BookOpen, Clock, ArrowRight } from "lucide-react";

export function ResourceTimeline() {
  const guides = [
    {
      id: "guide-1",
      title: "Understanding Cognitive Reframing Techniques",
      category: "Mental Health Science",
      readTime: "4 min read",
      desc: "Learn how identifying cognitive distortions helps shift anxious thought patterns into balanced perspectives.",
    },
    {
      id: "guide-2",
      title: "The Neurobiology of Stress & Cortisol Regulation",
      category: "Physiological Wellness",
      readTime: "5 min read",
      desc: "How vagus nerve stimulation, diaphragmatic breathing, and cold exposure restore autonomic nervous system balance.",
    },
    {
      id: "guide-3",
      title: "Building Sleep Consistency for Emotional Stability",
      category: "Lifestyle Hygiene",
      readTime: "3 min read",
      desc: "Optimizing light exposure, temperature, and evening routines to improve REM and deep slow-wave sleep.",
    },
  ];

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 backdrop-blur-3xl shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Educational Wellness Library
          </h3>
        </div>
        <span className="text-[10px] font-bold text-slate-400">
          Clinical Guidance Articles
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {guides.map((g) => (
          <div
            key={g.id}
            className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all backdrop-blur-xl space-y-2.5 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {g.category}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {g.readTime}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white leading-snug">
                {g.title}
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {g.desc}
              </p>
            </div>

            <button className="pt-2 flex items-center justify-between text-xs font-bold text-emerald-400 border-t border-white/[0.04] hover:translate-x-0.5 transition-transform">
              <span>Read Guide</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
