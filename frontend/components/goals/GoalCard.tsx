"use client";

import React, { useState } from "react";
import { WellnessGoal } from "@/services/goals";
import { Check, Trash2, Award, Sparkles } from "lucide-react";

interface GoalCardProps {
  goal: WellnessGoal;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const TYPE_ACCENTS: Record<string, string> = {
  sleep: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  exercise: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  meditation: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  hydration: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  mood: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  custom: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
};

export function GoalCard({ goal, onComplete, onDelete }: GoalCardProps) {
  const [completing, setCompleting] = useState(false);
  const isCompleted = goal.status === "completed";

  const handleCompleteClick = () => {
    setCompleting(true);
    setTimeout(() => {
      onComplete(goal._id);
      setCompleting(false);
    }, 400);
  };

  const badgeCls = TYPE_ACCENTS[goal.type] ?? TYPE_ACCENTS.custom;

  return (
    <div
      className={`
        relative rounded-3xl border p-5 flex flex-col justify-between gap-4 transition-all duration-300 backdrop-blur-xl shadow-lg group
        ${isCompleted
          ? "bg-emerald-500/[0.02] border-emerald-500/20"
          : "bg-slate-900/40 border-white/[0.06] hover:border-accent/40 hover:-translate-y-1 hover:bg-slate-900/60"
        }
      `}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${badgeCls} tracking-wider`}>
          {goal.type}
        </span>
        <div className="flex items-center gap-1.5">
          {goal.ai_suggested && (
            <span className="text-[9px] bg-purple-500/15 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> AI
            </span>
          )}
          <span className="text-[9px] font-bold text-slate-400 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-full uppercase tracking-wider">
            {goal.frequency}
          </span>
        </div>
      </div>

      {/* Title & Target */}
      <div className="space-y-1.5">
        <h3 className={`text-xs font-bold leading-snug ${isCompleted ? "line-through text-slate-400" : "text-white group-hover:text-accent transition-colors"}`}>
          {goal.title}
        </h3>
        <p className="text-[10px] text-slate-400 font-medium">
          Target: <span className="text-white font-bold">{goal.target_value}</span>
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
        {!isCompleted ? (
          <button
            onClick={handleCompleteClick}
            disabled={completing}
            className={`flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 font-bold text-[10px] py-2 rounded-xl transition-all active:scale-95 ${
              completing ? "animate-pulse" : ""
            }`}
          >
            <Check className="h-3.5 w-3.5" />
            <span>{completing ? "Achieved!" : "Mark Completed"}</span>
          </button>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-[10px] py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <Award className="h-3.5 w-3.5 animate-pulse" />
            <span>Accomplished</span>
          </div>
        )}

        <button
          onClick={() => onDelete(goal._id)}
          className="p-2 bg-white/[0.02] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/[0.04] rounded-xl transition-all"
          aria-label={`Delete goal ${goal.title}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
