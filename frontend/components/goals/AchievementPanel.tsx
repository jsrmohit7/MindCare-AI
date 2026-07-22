"use client";

import React from "react";
import { Award, Flame, Target, Trophy } from "lucide-react";

interface AchievementPanelProps {
  streakDays: number;
  completedCount: number;
}

export function AchievementPanel({ streakDays, completedCount }: AchievementPanelProps) {
  const achievements = [
    {
      id: "streak_7",
      title: "7-Day Consistency",
      desc: "Logged daily check-ins for 7 consecutive days",
      icon: Flame,
      unlocked: streakDays >= 7,
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    },
    {
      id: "goals_3",
      title: "Milestone Architect",
      desc: "Successfully accomplished 3 wellness objectives",
      icon: Trophy,
      unlocked: completedCount >= 3,
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    },
    {
      id: "journey_starter",
      title: "Wellness Pioneer",
      desc: "Embark on your personal growth journey",
      icon: Target,
      unlocked: true,
      color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
    },
  ];

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 backdrop-blur-3xl shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Personal Best Achievements
          </h3>
        </div>
        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          {achievements.filter((a) => a.unlocked).length} / {achievements.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {achievements.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all backdrop-blur-md ${
                item.unlocked
                  ? "bg-white/[0.02] border-white/[0.08]"
                  : "bg-slate-950/40 border-white/[0.04] opacity-50 grayscale"
              }`}
            >
              <div className={`p-2.5 rounded-xl border ${item.color} shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-1">
                  {item.title}
                </h4>
                <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
