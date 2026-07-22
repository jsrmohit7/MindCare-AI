"use client";

import React from "react";
import { WellnessGoal } from "@/services/goals";
import { Check, MapPin, Target } from "lucide-react";

interface WellnessJourneyProps {
  activeGoals: WellnessGoal[];
  completedGoals: WellnessGoal[];
  onCompleteGoal: (id: string) => void;
  onDeleteGoal?: (id: string) => void;
}

export function WellnessJourney({
  activeGoals,
  completedGoals,
  onCompleteGoal,
}: WellnessJourneyProps) {
  const allGoals = [...completedGoals, ...activeGoals];

  if (allGoals.length === 0) return null;

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 backdrop-blur-3xl shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Personal Growth Pathway
          </h3>
        </div>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
          {completedGoals.length} Milestones Achieved
        </span>
      </div>

      {/* Pathway Flow */}
      <div className="relative pl-6 space-y-6 border-l-2 border-dashed border-white/[0.08]">
        {allGoals.map((goal) => {
          const isCompleted = goal.status === "completed";

          return (
            <div
              key={goal._id}
              className={`
                relative p-4.5 rounded-2xl border transition-all duration-300 backdrop-blur-xl group
                ${isCompleted
                  ? "bg-emerald-500/[0.03] border-emerald-500/20 text-slate-300"
                  : "bg-white/[0.02] border-white/[0.06] hover:border-accent/40 hover:bg-white/[0.04] text-white"
                }
              `}
            >
              {/* Node Marker on Path */}
              <div
                className={`
                  absolute -left-[31px] top-5 h-6 w-6 rounded-full border flex items-center justify-center transition-all duration-500
                  ${isCompleted
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-md shadow-emerald-500/20"
                    : "bg-slate-950 border-accent text-accent animate-pulse"
                  }
                `}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Target className="h-3.5 w-3.5" />}
              </div>

              {/* Goal Content */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border tracking-wider ${
                      isCompleted ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-accent/15 text-accent border-accent/30"
                    }`}>
                      {goal.type}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      {goal.frequency}
                    </span>
                  </div>
                  <h4 className={`text-xs font-bold ${isCompleted ? "line-through text-slate-400" : "text-white"}`}>
                    {goal.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Target: <span className="text-slate-200 font-bold">{goal.target_value}</span>
                  </p>
                </div>

                {/* Actions */}
                {!isCompleted && (
                  <button
                    onClick={() => onCompleteGoal(goal._id)}
                    className="p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0"
                  >
                    <Check className="h-3.5 w-3.5" /> Complete
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
