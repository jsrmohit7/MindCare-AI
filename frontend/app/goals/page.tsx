"use client";

import React, { useState, useEffect } from "react";
import { goalsService, WellnessGoal } from "@/services/goals";
import { Plus, Check, Trash2, Sparkles, Award, Target, Flame } from "lucide-react";


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
      // Remove from suggested list to avoid duplicate additions
      setSuggestedGoals(suggestedGoals.filter(s => s.title !== suggested.title));
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

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            🎯 Wellness Goals
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Build healthy daily streaks, complete objectives, and get habit recommendations.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form & Suggestions */}
          <section className="lg:col-span-5 space-y-8">
            
            {/* Create Goal Form */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-400" />
                Set New Goal
              </h2>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Goal Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Morning meditation, 7 hours sleep..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Goal Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="sleep">Sleep</option>
                      <option value="exercise">Exercise</option>
                      <option value="meditation">Meditation</option>
                      <option value="hydration">Hydration</option>
                      <option value="mood">Mood</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Metric (hours, times, water liters)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={targetValue}
                    onChange={(e) => setTargetValue(parseFloat(e.target.value))}
                    className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs p-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                >
                  <Plus className="h-4 w-4" />
                  {submitting ? "Creating..." : "Create Goal"}
                </button>
              </form>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-300">
                  <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                  AI Suggested Goals
                </h2>
                <span className="text-[9px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 text-indigo-300 font-bold uppercase tracking-wider">
                  Explainable
                </span>
              </div>

              {loadingSuggestions ? (
                <div className="text-slate-500 text-xs text-center py-6">Analyzing wellness trends...</div>
              ) : suggestedGoals.length === 0 ? (
                <div className="text-slate-500 text-xs text-center py-6">Your current stats are optimized. Log check-ins to unlock recommendations.</div>
              ) : (
                <div className="space-y-3">
                  {suggestedGoals.map((suggested, index) => (
                    <div key={index} className="bg-slate-950/40 border border-white/5 p-3 rounded-xl space-y-2 text-xs text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{suggested.title}</span>
                        <span className="text-[9px] text-slate-500 capitalize">{suggested.type}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 italic leading-relaxed">
                        &ldquo;{suggested.reason}&rdquo;
                      </p>
                      <button
                        onClick={() => handleAdoptSuggested(suggested)}
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-white/5 hover:bg-indigo-600 hover:text-white border border-white/10 text-slate-300 font-bold text-[10px] py-1.5 rounded-lg transition-all"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Adopt Goal
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </section>

          {/* Right Column: Goal Lists */}
          <section className="lg:col-span-7 space-y-6">
            
            {/* Active Goals */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-300">
                <Flame className="h-5 w-5 text-orange-400" />
                Active Objectives ({activeGoals.length})
              </h2>

              {loading ? (
                <div className="text-slate-500 text-center py-12 text-sm">Loading wellness goals...</div>
              ) : activeGoals.length === 0 ? (
                <div className="bg-white/5 border border-white/5 rounded-2xl p-12 text-center text-slate-500 text-xs">
                  No active goals at this moment. Build your wellness checklist!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeGoals.map((goal) => (
                    <div key={goal._id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between gap-4 transition-all hover:bg-white/10">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">{goal.frequency}</span>
                          {goal.ai_suggested && (
                            <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold uppercase">
                              AI Suggested
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-200 leading-tight">{goal.title}</h3>
                        <p className="text-[11px] text-slate-500">Target: {goal.target_value} ({goal.type})</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleComplete(goal._id)}
                          className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white font-bold text-[10px] py-1.5 rounded-lg transition-all"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Complete
                        </button>
                        <button
                          onClick={() => handleDelete(goal._id)}
                          className="p-1.5 bg-red-500/10 border border-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <div className="space-y-3 pt-6 border-t border-white/5">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-400">
                  <Award className="h-5 w-5 text-emerald-400" />
                  Accomplished Goals ({completedGoals.length})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedGoals.map((goal) => (
                    <div key={goal._id} className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 opacity-75 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-300 line-through leading-tight">{goal.title}</h3>
                        <Award className="h-4 w-4 text-emerald-400 shrink-0" />
                      </div>
                      <p className="text-[10px] text-slate-500">Completed at target: {goal.target_value} ({goal.type})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </section>

        </div>
      </div>
    </main>
  );
}
