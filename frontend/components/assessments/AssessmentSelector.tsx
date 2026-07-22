"use client";

import React from "react";
import { Activity, Clock, ShieldCheck, ArrowRight } from "lucide-react";

interface AssessmentSelectorProps {
  onStartAssessment: (type: "full" | "phq9" | "gad7") => void;
  activeType?: string;
  hasHistory?: boolean;
}

export function AssessmentSelector({
  onStartAssessment,
  activeType = "full",
}: AssessmentSelectorProps) {
  const options = [
    {
      id: "full",
      title: "Comprehensive Wellness Assessment",
      subtitle: "Full Clinical Battery",
      desc: "Evaluates PHQ-9 depression scale, GAD-7 anxiety scale, stress perception, sleep hygiene, lifestyle metrics, and subjective wellbeing.",
      duration: "5–7 mins",
      badge: "Recommended",
      color: "border-accent/40 bg-accent/5",
    },
    {
      id: "phq9",
      title: "PHQ-9 Depression Focus",
      subtitle: "Mood & Interest Scale",
      desc: "Standardized 9-question instrument assessing mood, energy levels, sleep patterns, and emotional health over the last 2 weeks.",
      duration: "2 mins",
      badge: "Targeted",
      color: "border-blue-500/30 bg-blue-500/5",
    },
    {
      id: "gad7",
      title: "GAD-7 Anxiety Focus",
      subtitle: "Anxiety & Worry Scale",
      desc: "Standardized 7-question clinical tool measuring nervousness, uncontrolled worry, restlessness, and irritability.",
      duration: "2 mins",
      badge: "Targeted",
      color: "border-purple-500/30 bg-purple-500/5",
    },
  ];

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 backdrop-blur-3xl shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Clinical Assessment Batteries
          </h3>
        </div>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Standardized Clinical Tools
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((opt) => (
          <div
            key={opt.id}
            onClick={() => onStartAssessment(opt.id as "full" | "phq9" | "gad7")}
            className={`
              relative p-5 rounded-2xl border transition-all duration-300 backdrop-blur-xl cursor-pointer group flex flex-col justify-between space-y-4 hover:-translate-y-1 hover:shadow-xl
              ${opt.id === activeType ? `${opt.color} shadow-lg` : "bg-white/[0.02] border-white/[0.06] hover:border-white/20"}
            `}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300">
                  {opt.badge}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-500" /> {opt.duration}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white group-hover:text-accent transition-colors leading-snug">
                {opt.title}
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {opt.desc}
              </p>
            </div>

            <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs font-bold text-accent group-hover:translate-x-0.5 transition-transform">
              <span>Begin Assessment</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
