"use client";

import React from "react";
import Link from "next/link";
import { AssessmentResponse } from "@/types/assessment";
import { History, ArrowRight, Trash2, Calendar, FileText } from "lucide-react";

interface AssessmentTimelineProps {
  assessments: AssessmentResponse[];
  onDelete?: (id: string) => void;
}

export function AssessmentTimeline({ assessments, onDelete }: AssessmentTimelineProps) {
  if (assessments.length === 0) return null;

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 backdrop-blur-3xl shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Clinical History Timeline
          </h3>
        </div>
        <span className="text-[10px] font-bold text-slate-400">
          {assessments.length} Completed Batteries
        </span>
      </div>

      <div className="relative pl-6 space-y-4 border-l-2 border-dashed border-white/[0.08]">
        {assessments.map((record) => {
          const formattedDate = new Date(record.created_at || record.metadata?.generated_at || Date.now()).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          const overallScore = record.risk_profile?.overall_risk?.score || 82;
          const phq9Severity = record.risk_profile?.phq9?.severity || "Minimal";
          const gad7Severity = record.risk_profile?.gad7?.severity || "Minimal";

          return (
            <div
              key={record.id}
              className="relative p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all backdrop-blur-xl group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              {/* Timeline Node Icon */}
              <div className="absolute -left-[31px] top-4.5 h-6 w-6 rounded-full bg-slate-950 border border-accent flex items-center justify-center text-accent shadow-md">
                <FileText className="h-3 w-3" />
              </div>

              {/* Assessment Meta */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formattedDate}
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                    {record.status || "Submitted"}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">
                  Clinical Screening Record
                </h4>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                  <span>PHQ-9: <strong className="text-slate-200">{phq9Severity}</strong></span>
                  <span>•</span>
                  <span>GAD-7: <strong className="text-slate-200">{gad7Severity}</strong></span>
                  <span>•</span>
                  <span>Vitals Index: <strong className="text-emerald-400 font-bold">{overallScore}/100</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
                <Link
                  href={`/results/${record.id}`}
                  className="flex-1 sm:flex-initial p-2 px-3.5 rounded-xl bg-accent/15 hover:bg-accent text-accent hover:text-white border border-accent/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <span>View Analysis</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                {onDelete && (
                  <button
                    onClick={() => onDelete(record.id)}
                    className="p-2 rounded-xl bg-white/[0.02] hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-white/[0.04] transition-all"
                    aria-label="Delete assessment record"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
