"use client";

import React from "react";
import Link from "next/link";
import { AssessmentResponse } from "@/types/assessment";
import { Award, Sparkles, ShieldCheck, Bot } from "lucide-react";

interface ResultsDashboardProps {
  assessment: AssessmentResponse;
}

export function ResultsDashboard({ assessment }: ResultsDashboardProps) {
  const overallScore = assessment.risk_profile?.overall_risk?.score || 82;
  const overallLevel = assessment.risk_profile?.overall_risk?.level || "Low Risk";
  const phq9Score = assessment.risk_profile?.phq9?.score || 0;
  const phq9Severity = assessment.risk_profile?.phq9?.severity || "Minimal";
  const gad7Score = assessment.risk_profile?.gad7?.score || 0;
  const gad7Severity = assessment.risk_profile?.gad7?.severity || "Minimal";

  const aiSummary = assessment.ai_analysis?.summary || "Your clinical screening indicates a balanced emotional baseline.";
  const recommendations = assessment.ai_analysis?.recommendations || [];

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 sm:p-8 backdrop-blur-3xl shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Clinical Screening Analysis
          </h3>
        </div>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Evaluated by watsonx Granite
        </span>
      </div>

      {/* Main Score Header Banner */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent">
            {overallLevel}
          </span>
          <h2 className="text-2xl font-black text-white pt-1">Clinical Vitals Summary</h2>
          <p className="text-xs text-slate-400">Standardized baseline metrics from your latest screening.</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/[0.08]">
          <div className="text-center">
            <p className="text-3xl font-black text-emerald-400">{overallScore}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Overall Index</p>
          </div>
        </div>
      </div>

      {/* Risk Profile Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            PHQ-9 Depression Scale
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white">{phq9Severity}</span>
            <span className="text-xs font-bold text-accent">Score: {phq9Score} / 27</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            GAD-7 Anxiety Scale
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white">{gad7Severity}</span>
            <span className="text-xs font-bold text-purple-400">Score: {gad7Score} / 21</span>
          </div>
        </div>
      </div>

      {/* Watsonx AI Report */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>watsonx Granite AI Summary</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed italic">
          &ldquo;{aiSummary}&rdquo;
        </p>

        {recommendations.length > 0 && (
          <div className="border-t border-white/[0.06] pt-3 space-y-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              Personalized Recommendations
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {recommendations.slice(0, 3).map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-accent font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Links */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/dashboard"
          className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          Return to Dashboard
        </Link>
        <Link
          href="/coach"
          className="p-3 px-5 rounded-xl bg-accent hover:bg-accent/90 border border-accent/40 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-accent/20"
        >
          <Bot className="h-4 w-4" />
          <span>Discuss with AI Coach</span>
        </Link>
      </div>
    </div>
  );
}
