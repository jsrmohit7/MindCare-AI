"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useEmotion } from "@/context/EmotionContext";
import { goalsService, WellnessGoal } from "@/services/goals";
import { dailyWellnessService } from "@/services/dailyWellness";

import { GoalsHero } from "@/components/goals/GoalsHero";
import { ProgressConstellation } from "@/components/goals/ProgressConstellation";
import { WellnessJourney } from "@/components/goals/WellnessJourney";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalCompanion } from "@/components/goals/GoalCompanion";
import { AchievementPanel } from "@/components/goals/AchievementPanel";
import { GoalEmptyState } from "@/components/goals/GoalEmptyState";

import { Plus, Target, Flame, Loader2, X } from "lucide-react";
import Button from "@/components/Button";

export default function GoalsPage() {
  const { detectedEmotion, explanation, motivation } = useEmotion();

  // Mounted & Cinematic entrance state
  const [mounted, setMounted] = useState(false);
  const [entranceStep, setEntranceStep] = useState(0);

  // Goals Data State
  const [goals, setGoals] = useState<WellnessGoal[]>([]);
  const [suggestedGoals, setSuggestedGoals] = useState<WellnessGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [streakDays, setStreakDays] = useState(0);

  // Create Goal Form Modal / Accordion State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("custom");
  const [targetValue, setTargetValue] = useState(1.0);
  const [frequency, setFrequency] = useState("daily");

  // Selected Goal for Constellation highlight
  const [selectedGoal, setSelectedGoal] = useState<WellnessGoal | null>(null);

  // Staggered Entrance Animation Pipeline
  useEffect(() => {
    setMounted(true);
    const timers = [
      setTimeout(() => setEntranceStep(1), 150),
      setTimeout(() => setEntranceStep(2), 350),
      setTimeout(() => setEntranceStep(3), 600),
      setTimeout(() => setEntranceStep(4), 850),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  // Fetch Goals, Suggestions, and Streak
  const loadGoalsData = useCallback(async () => {
    try {
      const [goalsData, suggestionsData, streakData] = await Promise.all([
        goalsService.listGoals(),
        goalsService.getSuggestedGoals(),
        dailyWellnessService.getStreak(),
      ]);

      setGoals(goalsData);
      setSuggestedGoals(suggestionsData);
      setStreakDays(streakData.current_streak || 0);
    } catch (err) {
      console.error("Failed to load goals data:", err);
    } finally {
      setLoading(false);
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    loadGoalsData();
  }, [loadGoalsData]);

  // Create Goal Handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await goalsService.createGoal(title, type, targetValue, frequency);
      setTitle("");
      setType("custom");
      setTargetValue(1.0);
      setFrequency("daily");
      setShowCreateForm(false);
      await loadGoalsData();
    } catch (err) {
      console.error("Failed to create goal:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Adopt AI Suggested Goal Handler
  const handleAdoptSuggested = async (suggested: WellnessGoal) => {
    try {
      await goalsService.createGoal(
        suggested.title,
        suggested.type,
        suggested.target_value,
        suggested.frequency,
        true
      );
      setSuggestedGoals((prev) => prev.filter((s) => s.title !== suggested.title));
      await loadGoalsData();
    } catch (err) {
      console.error("Failed to adopt suggested goal:", err);
    }
  };

  // Complete Goal Handler
  const handleComplete = async (id: string) => {
    try {
      await goalsService.completeGoal(id);
      await loadGoalsData();
    } catch (err) {
      console.error("Failed to complete goal:", err);
    }
  };

  // Delete Goal Handler
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this objective?")) return;
    try {
      await goalsService.deleteGoal(id);
      await loadGoalsData();
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  // Emotion-adaptive goal prioritization
  const activeGoals = useMemo(() => {
    const rawActive = goals.filter((g) => g.status === "active");
    
    // Emotion-specific priority weights
    const priorityMap: Record<string, string[]> = {
      Happy: ["exercise", "hydration", "custom", "meditation"],
      Calm: ["meditation", "sleep", "custom", "hydration"],
      Focused: ["exercise", "hydration", "custom", "sleep"],
      Stressed: ["meditation", "sleep", "hydration", "custom"],
      Anxious: ["meditation", "sleep", "mood", "custom"],
      "Low Mood": ["custom", "mood", "meditation", "sleep"],
    };

    const priorities = priorityMap[detectedEmotion] || priorityMap["Calm"];

    return [...rawActive].sort((a, b) => {
      const idxA = priorities.indexOf(a.type);
      const idxB = priorities.indexOf(b.type);
      const weightA = idxA === -1 ? 99 : idxA;
      const weightB = idxB === -1 ? 99 : idxB;
      return weightA - weightB;
    });
  }, [goals, detectedEmotion]);

  const completedGoals = useMemo(() => {
    return goals.filter((g) => g.status === "completed");
  }, [goals]);

  return (
    <ProtectedRoute>
      <div
        className={`max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8 transition-all duration-700 ${
          mounted ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
        }`}
      >
        {/* Step 1: Living Hero */}
        <div className={`transition-all duration-500 ${entranceStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <GoalsHero
            emotion={detectedEmotion}
            activeCount={activeGoals.length}
            completedCount={completedGoals.length}
            streakDays={streakDays}
            scorePreview={88}
            motivationSnippet={motivation || explanation}
          />
        </div>

        {/* Step 2: Progress Constellation Signature Feature */}
        {goals.length > 0 && (
          <div className={`transition-all duration-500 ${entranceStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <ProgressConstellation
              goals={goals}
              onSelectGoal={(g) => setSelectedGoal(selectedGoal?._id === g._id ? null : g)}
            />
          </div>
        )}

        {/* Empty State when no goals exist */}
        {goals.length === 0 && !loading && (
          <GoalEmptyState
            emotion={detectedEmotion}
            onOpenCreateForm={() => setShowCreateForm(true)}
          />
        )}

        {/* Step 3: Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Create Form & Goal Companion */}
          <div className={`lg:col-span-4 space-y-6 transition-all duration-500 ${entranceStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            
            {/* Create Goal Action Card */}
            <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 backdrop-blur-3xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    New Objective
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="p-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  {showCreateForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </button>
              </div>

              {(showCreateForm || goals.length === 0) && (
                <form onSubmit={handleCreate} className="space-y-3.5 text-xs animate-fadeIn">
                  <div className="space-y-1.5">
                    <label htmlFor="goal-title" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Title
                    </label>
                    <input
                      id="goal-title"
                      type="text"
                      placeholder="e.g. 7 hours sleep, 20 min walk..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/[0.08] rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:border-accent/40 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="goal-type" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Category
                      </label>
                      <select
                        id="goal-type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-slate-900/60 border border-white/[0.08] rounded-2xl p-3 text-xs text-slate-200 focus:border-accent/40 focus:outline-none transition-all"
                      >
                        {["sleep", "exercise", "meditation", "hydration", "mood", "custom"].map((t) => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="goal-freq" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Frequency
                      </label>
                      <select
                        id="goal-freq"
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="w-full bg-slate-900/60 border border-white/[0.08] rounded-2xl p-3 text-xs text-slate-200 focus:border-accent/40 focus:outline-none transition-all"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="goal-target" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Target Value
                    </label>
                    <input
                      id="goal-target"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={targetValue}
                      onChange={(e) => setTargetValue(parseFloat(e.target.value) || 1.0)}
                      className="w-full bg-slate-900/60 border border-white/[0.08] rounded-2xl p-3 text-xs text-white focus:border-accent/40 focus:outline-none transition-all"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting || !title.trim()}
                    variant="primary"
                    size="sm"
                    className="w-full justify-center active:scale-95 border border-accent/40 shadow-lg shadow-accent/20 mt-2"
                  >
                    {submitting ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating Objective...</>
                    ) : (
                      <><Plus className="h-3.5 w-3.5" /> Create Objective</>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* AI Companion & Suggestions */}
            <GoalCompanion
              emotion={detectedEmotion}
              suggestedGoals={suggestedGoals}
              loadingSuggestions={loadingSuggestions}
              onAdoptSuggested={handleAdoptSuggested}
            />

          </div>

          {/* Right Column: Active Goals Grid, Wellness Journey & Achievements */}
          <div className={`lg:col-span-8 space-y-6 transition-all duration-500 ${entranceStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            
            {/* Active Goals Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-400" />
                  <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">
                    Active Objectives ({activeGoals.length})
                  </h2>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Prioritized for {detectedEmotion}
                </span>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 rounded-3xl bg-white/[0.02] animate-pulse border border-white/[0.04]" />
                  ))}
                </div>
              ) : activeGoals.length === 0 ? (
                <div className="p-8 rounded-3xl border border-white/[0.06] bg-slate-950/40 text-center space-y-2 backdrop-blur-xl">
                  <Target className="h-8 w-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-400">No active objectives</p>
                  <p className="text-[11px] text-slate-500">Create a goal or adopt an AI suggestion above to begin.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeGoals.map((goal) => (
                    <GoalCard
                      key={goal._id}
                      goal={goal}
                      onComplete={handleComplete}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Wellness Journey Visual Roadmap */}
            <WellnessJourney
              activeGoals={activeGoals}
              completedGoals={completedGoals}
              onCompleteGoal={handleComplete}
              onDeleteGoal={handleDelete}
            />

            {/* Achievements Showcase */}
            <AchievementPanel
              streakDays={streakDays}
              completedCount={completedGoals.length}
            />

          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
