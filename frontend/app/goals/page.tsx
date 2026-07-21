"use client";

import React, { useState, useEffect } from "react";
import { goalsService, WellnessGoal } from "@/services/goals";
import { Plus, Check, Trash2, Sparkles, Award, Target, Flame, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Card from "@/components/Card";
import Button from "@/components/Button";

// ─── Goal type → color mapping ───────────────────────────────────────────────
const TYPE_ACCENTS: Record<string, string> = {
  sleep: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  exercise: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  meditation: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  hydration: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  mood: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  custom: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
};

const FREQ_COLORS: Record<string, string> = {
  daily: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  weekly: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
};

function TypeBadge({ type }: { type: string }) {
  const cls = TYPE_ACCENTS[type] ?? TYPE_ACCENTS.custom;
  return (
    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${cls} tracking-wider`}>
      {type}
    </span>
  );
}

function FreqBadge({ freq }: { freq: string }) {
  const cls = FREQ_COLORS[freq] ?? FREQ_COLORS.daily;
  return (
    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${cls} tracking-wider`}>
      {freq}
    </span>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<WellnessGoal[]>([]);
  const [suggestedGoals, setSuggestedGoals] = useState<WellnessGoal[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("custom");
  const [targetValue, setTargetValue] = useState(1.0);
  const [frequency, setFrequency] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    loadGoals();
    loadSuggestions();
  }, []);

  const loadGoals = async () => {
    try {
      const data = await goalsService.listGoals();
      setGoals(data);
    } catch (err) {
      console.error("Failed to load goals:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const data = await goalsService.getSuggestedGoals();
      setSuggestedGoals(data);
    } catch (err) {
      console.error("Failed to load suggested goals:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

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
      await loadGoals();
    } catch (err) {
      console.error("Failed to create goal:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdoptSuggested = async (suggested: WellnessGoal) => {
    try {
      await goalsService.createGoal(
        suggested.title,
        suggested.type,
        suggested.target_value,
        suggested.frequency,
        true
      );
      setSuggestedGoals(suggestedGoals.filter((s) => s.title !== suggested.title));
      await loadGoals();
    } catch (err) {
      console.error("Failed to adopt suggested goal:", err);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await goalsService.completeGoal(id);
      await loadGoals();
    } catch (err) {
      console.error("Failed to complete goal:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      await goalsService.deleteGoal(id);
      await loadGoals();
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Header */}
        <div className="space-y-1.5 border-b border-white/[0.04] pb-6">
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Target className="h-6 w-6 text-rose-400" aria-hidden="true" />
            Wellness Goals
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">Build healthy habits, complete milestones, and adopt Watsonx AI suggested objectives.</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            { label: "Active", value: activeGoals.length, color: "text-indigo-400" },
            { label: "Completed", value: completedGoals.length, color: "text-emerald-400" },
            { label: "AI Suggestions", value: suggestedGoals.length, color: "text-purple-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-900/40 border border-white/[0.05] rounded-3xl p-5 text-center shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 bg-white/[0.01] blur-2xl rounded-full" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
              <p className={`text-2xl font-black mt-1.5 ${color}`}>{loading ? "—" : value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left: Form + AI Suggestions */}
          <div className="lg:col-span-4 space-y-6">

            {/* Create Goal Form */}
            <Card className="space-y-4">
              <h2 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider border-b border-white/[0.04] pb-3">
                <Plus className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                New Goal
              </h2>
              <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                <div className="space-y-2">
                  <label htmlFor="goal-title" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Title
                  </label>
                  <input
                    id="goal-title"
                    type="text"
                    placeholder="e.g. 7 hours sleep, morning walk…"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-white/[0.08] rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-2">
                    <label htmlFor="goal-type" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Type
                    </label>
                    <select
                      id="goal-type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-slate-950 border border-white/[0.08] rounded-2xl p-3 text-xs text-slate-300 focus:border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    >
                      {["sleep", "exercise", "meditation", "hydration", "mood", "custom"].map((t) => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="goal-freq" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Frequency
                    </label>
                    <select
                      id="goal-freq"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full bg-slate-950 border border-white/[0.08] rounded-2xl p-3 text-xs text-slate-300 focus:border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="goal-target" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Target <span className="font-medium normal-case text-slate-600">(hours, times, litres)</span>
                  </label>
                  <input
                    id="goal-target"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={targetValue}
                    onChange={(e) => setTargetValue(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-white/[0.08] rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  variant="primary"
                  className="w-full justify-center active:scale-[0.98] border border-indigo-500/30 mt-2"
                  size="sm"
                >
                  {submitting ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…</>
                  ) : (
                    <><Plus className="h-3.5 w-3.5" /> Create Goal</>
                  )}
                </Button>
              </form>
            </Card>

            {/* AI Suggested Goals */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                <h2 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <Sparkles className="h-4 w-4 text-violet-400" aria-hidden="true" />
                  AI Suggestions
                </h2>
                <span className="text-[9px] font-bold uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full tracking-wider">
                  Smart
                </span>
              </div>

              {loadingSuggestions ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-white/[0.02] animate-pulse border border-white/[0.04]" />)}
                </div>
              ) : suggestedGoals.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 leading-relaxed">
                  Your stats look great! Log more check-ins to unlock personalized recommendations.
                </p>
              ) : (
                <div className="space-y-3">
                  {suggestedGoals.map((suggested, index) => (
                    <div key={index} className="bg-slate-950/40 border border-white/[0.04] p-3.5 rounded-2xl space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-200">{suggested.title}</p>
                        <TypeBadge type={suggested.type} />
                      </div>
                      {suggested.reason && (
                        <p className="text-[11px] text-slate-500 leading-relaxed italic">&ldquo;{suggested.reason}&rdquo;</p>
                      )}
                      <button
                        onClick={() => handleAdoptSuggested(suggested)}
                        className="w-full flex items-center justify-center gap-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 font-bold text-[10px] py-2 rounded-xl transition-all"
                      >
                        <Check className="h-3.5 w-3.5" /> Adopt Goal
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right: Active + Completed Goals */}
          <div className="lg:col-span-8 space-y-6">

            {/* Active Goals */}
            <section aria-label="Active goals" className="space-y-4">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-400" aria-hidden="true" />
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Active Objectives ({activeGoals.length})
                </h2>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-3xl bg-slate-900/40 animate-pulse border border-white/[0.04]" />)}
                </div>
              ) : activeGoals.length === 0 ? (
                <div className="rounded-3xl border border-white/[0.04] bg-slate-900/20 p-10 text-center space-y-3 backdrop-blur-xl">
                  <Target className="h-8 w-8 text-slate-600 mx-auto" aria-hidden="true" />
                  <p className="text-xs text-slate-400 font-bold">No active goals</p>
                  <p className="text-xs text-slate-500">Create your first wellness goal or adopt an AI suggestion.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeGoals.map((goal) => (
                    <div key={goal._id} className="rounded-3xl border border-white/[0.05] bg-slate-900/40 p-5 flex flex-col justify-between gap-4 hover:border-white/10 hover:bg-slate-900/60 transition-all duration-300 shadow-md">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <FreqBadge freq={goal.frequency} />
                          {goal.ai_suggested && (
                            <span className="text-[9px] bg-violet-500/10 border border-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              AI
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-slate-200 leading-snug">{goal.title}</h3>
                        <div className="flex items-center gap-2">
                          <TypeBadge type={goal.type} />
                          <span className="text-[10px] text-slate-500 font-semibold">Target: {goal.target_value}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-white/[0.04]">
                        <button
                          onClick={() => handleComplete(goal._id)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 font-bold text-[10px] py-2 rounded-xl transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <Check className="h-3.5 w-3.5" /> Complete
                        </button>
                        <button
                          onClick={() => handleDelete(goal._id)}
                          className="p-2 bg-white/[0.02] hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-white/[0.04] rounded-xl transition-all focus:outline-none"
                          aria-label={`Delete goal ${goal.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <section aria-label="Completed goals" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Accomplished ({completedGoals.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {completedGoals.map((goal) => (
                    <div key={goal._id} className="flex items-center justify-between bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl p-4">
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="text-xs font-bold text-slate-400 line-through truncate">{goal.title}</h3>
                        <p className="text-[10px] text-slate-500 font-semibold">{goal.type} · {goal.target_value}</p>
                      </div>
                      <Award className="h-5 w-5 text-emerald-400 shrink-0 ml-3 animate-pulse" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
