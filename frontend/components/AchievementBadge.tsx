"use client";

import React from "react";

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number; // 0–100
  progressLabel?: string;
}

interface AchievementBadgeProps {
  achievement: Achievement;
}

export default function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const { emoji, title, description, unlocked, progress, progressLabel } = achievement;

  return (
    <div
      className={`
        relative rounded-2xl border p-4 flex flex-col items-center text-center space-y-2 transition-all duration-300
        ${unlocked
          ? "border-indigo-500/30 bg-indigo-500/10 shadow-md shadow-indigo-500/10"
          : "border-white/5 bg-white/5 opacity-60"
        }
      `}
      role="listitem"
      aria-label={`${title}: ${unlocked ? "Unlocked" : "Locked"}`}
    >
      {/* Lock overlay for locked achievements */}
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/20 backdrop-blur-[1px]">
          <span className="text-xl" aria-hidden="true">🔒</span>
        </div>
      )}

      <span className="text-3xl" aria-hidden="true">{emoji}</span>
      <div className="space-y-0.5">
        <p className="text-xs font-bold text-white leading-tight">{title}</p>
        <p className="text-[10px] text-slate-500 leading-tight">{description}</p>
      </div>

      {/* Progress bar if in-progress */}
      {!unlocked && progress !== undefined && progress > 0 && (
        <div className="w-full space-y-1" aria-label={`Progress: ${progressLabel}`}>
          <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          {progressLabel && (
            <span className="text-[9px] text-slate-500 font-semibold">{progressLabel}</span>
          )}
        </div>
      )}

      {unlocked && (
        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
          Unlocked ✓
        </span>
      )}
    </div>
  );
}

// Helper to compute achievements from user data
export function computeAchievements(params: {
  totalCheckins: number;
  currentStreak: number;
  longestStreak: number;
  hasAssessment: boolean;
  analyticsData: Array<{ mood: string; sleep: string; water: string; exercise: boolean }>;
}): Achievement[] {
  const { totalCheckins, longestStreak, hasAssessment, analyticsData } = params;

  const moodImproved = (() => {
    if (analyticsData.length < 7) return false;
    const recent = analyticsData.slice(-7);
    const happyCount = recent.filter(r =>
      r.mood === "Happy" || r.mood === "Very Happy"
    ).length;
    return happyCount >= 5;
  })();

  const sleepChampion = analyticsData.filter(r =>
    r.sleep === "8+ hours" || r.sleep === "7-8 hours"
  ).length >= 7;

  const hydrationHero = analyticsData.filter(r =>
    r.water === "More than 8 glasses"
  ).length >= 7;

  const fitnessStarter = analyticsData.filter(r => r.exercise).length >= 5;

  return [
    {
      id: "first_assessment",
      emoji: "🧠",
      title: "First Assessment",
      description: "Complete your first mental health assessment",
      unlocked: hasAssessment,
      progress: hasAssessment ? 100 : 0,
    },
    {
      id: "first_checkin",
      emoji: "🏆",
      title: "First Check-In",
      description: "Complete your first daily wellness check-in",
      unlocked: totalCheckins >= 1,
      progress: totalCheckins >= 1 ? 100 : 0,
    },
    {
      id: "streak_7",
      emoji: "🔥",
      title: "7-Day Streak",
      description: "Maintain a 7-day consecutive check-in streak",
      unlocked: longestStreak >= 7,
      progress: Math.min(100, Math.round((longestStreak / 7) * 100)),
      progressLabel: `${Math.min(longestStreak, 7)}/7 days`,
    },
    {
      id: "streak_30",
      emoji: "⚡",
      title: "30-Day Streak",
      description: "Maintain a 30-day consecutive streak",
      unlocked: longestStreak >= 30,
      progress: Math.min(100, Math.round((longestStreak / 30) * 100)),
      progressLabel: `${Math.min(longestStreak, 30)}/30 days`,
    },
    {
      id: "mood_improver",
      emoji: "😊",
      title: "Mood Improver",
      description: "Log happy moods for 5 out of 7 days",
      unlocked: moodImproved,
      progress: moodImproved ? 100 : Math.round(
        (analyticsData.filter(r => r.mood === "Happy" || r.mood === "Very Happy").length / 5) * 100
      ),
    },
    {
      id: "sleep_champion",
      emoji: "😴",
      title: "Sleep Champion",
      description: "Log quality sleep (7-8+ hours) for 7 days",
      unlocked: sleepChampion,
      progress: sleepChampion ? 100 : Math.min(100, Math.round(
        (analyticsData.filter(r => r.sleep === "8+ hours" || r.sleep === "7-8 hours").length / 7) * 100
      )),
      progressLabel: `${Math.min(analyticsData.filter(r => r.sleep === "8+ hours" || r.sleep === "7-8 hours").length, 7)}/7 days`,
    },
    {
      id: "hydration_hero",
      emoji: "💧",
      title: "Hydration Hero",
      description: "Log excellent hydration for 7 days",
      unlocked: hydrationHero,
      progress: hydrationHero ? 100 : Math.min(100, Math.round(
        (analyticsData.filter(r => r.water === "More than 8 glasses").length / 7) * 100
      )),
      progressLabel: `${Math.min(analyticsData.filter(r => r.water === "More than 8 glasses").length, 7)}/7 days`,
    },
    {
      id: "fitness_starter",
      emoji: "🏃",
      title: "Fitness Starter",
      description: "Log exercise for 5 days",
      unlocked: fitnessStarter,
      progress: fitnessStarter ? 100 : Math.min(100, Math.round(
        (analyticsData.filter(r => r.exercise).length / 5) * 100
      )),
      progressLabel: `${Math.min(analyticsData.filter(r => r.exercise).length, 5)}/5 days`,
    },
  ];
}
