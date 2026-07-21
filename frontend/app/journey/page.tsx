"use client";

import React, { useState, useEffect, useCallback } from "react";
import { journeyService, JourneyEvent, MonthlyReview, CorrelationsState } from "@/services/journey";
import { dailyWellnessService } from "@/services/dailyWellness";
import {
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Award,
  FileText,
  CheckCircle2,
  MessageSquare,
  Activity,
  Clock,
  Compass,
  BarChart3,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Card from "@/components/Card";

// ─── Event type → icon & color ───────────────────────────────────────────────
const EVENT_CONFIG: Record<string, { icon: React.ReactNode; color: string; dot: string }> = {
  assessment: {
    icon: <FileText className="h-3.5 w-3.5 text-sky-400" />,
    color: "border-sky-500/10 bg-sky-500/5",
    dot: "bg-sky-500",
  },
  checkin: {
    icon: <Activity className="h-3.5 w-3.5 text-emerald-400" />,
    color: "border-emerald-500/10 bg-emerald-500/5",
    dot: "bg-emerald-500",
  },
  coach: {
    icon: <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />,
    color: "border-indigo-500/10 bg-indigo-500/5",
    dot: "bg-indigo-500",
  },
  journal: {
    icon: <Clock className="h-3.5 w-3.5 text-violet-400" />,
    color: "border-violet-500/10 bg-violet-500/5",
    dot: "bg-violet-500",
  },
  goal: {
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-rose-400" />,
    color: "border-rose-500/10 bg-rose-500/5",
    dot: "bg-rose-500",
  },
  achievement: {
    icon: <Award className="h-3.5 w-3.5 text-amber-400" />,
    color: "border-amber-500/10 bg-amber-500/5",
    dot: "bg-amber-500",
  },
};

function getEventConfig(type: string) {
  return EVENT_CONFIG[type] ?? {
    icon: <Activity className="h-3.5 w-3.5 text-slate-400" />,
    color: "border-white/[0.04] bg-white/[0.02]",
    dot: "bg-slate-500",
  };
}

function CorrelationCard({
  label,
  strength,
  explanation,
}: {
  label: string;
  strength: string;
  explanation: string;
}) {
  const isStrong = strength === "strong";
  return (
    <div className="bg-slate-950/40 border border-white/[0.04] p-4 rounded-2xl space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold text-slate-200">{label}</p>
        <span
          className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase shrink-0 capitalize ${
            isStrong
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}
        >
          {strength}
        </span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed font-semibold">{explanation}</p>
    </div>
  );
}

export default function JourneyPage() {
  const [timeline, setTimeline] = useState<JourneyEvent[]>([]);
  const [review, setReview] = useState<MonthlyReview | null>(null);
  const [correlations, setCorrelations] = useState<CorrelationsState | null>(null);
  const [filterRange, setFilterRange] = useState("month");
  const [stats, setStats] = useState({
    totalCheckins: 0,
    currentStreak: 0,
    longestStreak: 0,
    firstDate: "N/A",
  });
  const [loading, setLoading] = useState(true);

  const loadJourneyData = useCallback(async () => {
    try {
      const [timelineRes, reviewRes, correlationsRes, streakRes, historyRes] = await Promise.all([
        journeyService.getJourneyTimeline(filterRange),
        journeyService.getMonthlyReview(),
        journeyService.getCorrelations(),
        dailyWellnessService.getStreak(),
        dailyWellnessService.getHistory(),
      ]);
      setTimeline(timelineRes);
      setReview(reviewRes);
      setCorrelations(correlationsRes);
      const firstCheckin = historyRes.length > 0 ? historyRes[historyRes.length - 1].date : "N/A";
      setStats({
        totalCheckins: streakRes.total_checkins,
        currentStreak: streakRes.current_streak,
        longestStreak: streakRes.longest_streak,
        firstDate: firstCheckin,
      });
    } catch (err) {
      console.error("Failed to load journey data:", err);
    } finally {
      setLoading(false);
    }
  }, [filterRange]);

  useEffect(() => {
    loadJourneyData();
  }, [loadJourneyData]);

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto py-6 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.04] pb-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Compass className="h-6 w-6 text-indigo-400" aria-hidden="true" />
              Wellness Journey
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">Visualize milestones, track progress trends, and review monthly reports.</p>
          </div>

          {/* Range Filter */}
          <div className="flex bg-white/[0.02] border border-white/[0.06] p-1 rounded-2xl text-xs font-bold gap-1 shrink-0" role="group" aria-label="Filter timeline range">
            {["today", "week", "month"].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRange(r)}
                aria-pressed={filterRange === r}
                className={`px-4 py-1.5 rounded-xl capitalize transition-all focus:outline-none ${
                  filterRange === r
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Strip */}
        <div className="bg-slate-900/40 border border-white/[0.05] rounded-3xl p-5 shadow-inner">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
            {[
              { label: "First Check-in", value: stats.firstDate },
              { label: "Total Logs", value: stats.totalCheckins },
              { label: "Current Streak", value: `${stats.currentStreak}d` },
              { label: "Best Streak", value: `${stats.longestStreak}d` },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                <p className="font-bold text-slate-200">{loading ? "—" : value}</p>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-3xl bg-slate-900/40 animate-pulse border border-white/[0.04]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: Timeline */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Timeline Milestones ({timeline.length})
                </h2>
              </div>

              {timeline.length === 0 ? (
                <div className="rounded-3xl border border-white/[0.04] bg-slate-900/20 p-10 text-center space-y-3 backdrop-blur-xl">
                  <Compass className="h-8 w-8 text-slate-600 mx-auto" aria-hidden="true" />
                  <p className="text-xs text-slate-400 font-bold">No activity in this range</p>
                  <p className="text-xs text-slate-500">Keep completing assessments and daily check-ins to build your journey.</p>
                </div>
              ) : (
                <ol className="relative border-l border-white/[0.08] pl-6 ml-3 space-y-5">
                  {timeline.map((event) => {
                    const config = getEventConfig(event.event_type);
                    return (
                      <li key={event._id} className="relative">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[27px] top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/[0.08] bg-slate-950 shadow`}>
                          <span className={`h-2 w-2 rounded-full ${config.dot}`} aria-hidden="true" />
                        </div>

                        <div className={`border rounded-2xl p-4 space-y-1.5 transition-all hover:bg-white/[0.02] ${config.color}`}>
                          <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
                            <div className="flex items-center gap-1.5">
                              {config.icon}
                              <span className="uppercase tracking-wider text-slate-400">
                                {event.event_type}
                              </span>
                            </div>
                            <span className="text-slate-600 shrink-0">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-200">{event.title}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed font-semibold">{event.description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {/* Right: Monthly Review + Correlations */}
            <div className="lg:col-span-5 space-y-6">

              {/* Monthly AI Review */}
              {review ? (
                <Card className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-400" aria-hidden="true" />
                      <h2 className="text-xs font-bold text-white uppercase tracking-wider">Monthly Review</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{review.month}</p>
                      <p className="text-lg font-black text-violet-400">{review.monthly_wellness_score} pts</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed border-l-2 border-violet-500/40 pl-3 italic">
                    &ldquo;{review.ai_summary}&rdquo;
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1.5 border-t border-white/[0.04] text-xs">
                    {[
                      { label: "Stress Trend", value: review.stress_trend },
                      { label: "Sleep Trend", value: review.sleep_trend },
                      { label: "Mood Trend", value: review.mood_trend },
                      { label: "Exercise", value: review.exercise_trend },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">{label}</p>
                        <p className="font-bold text-slate-300 capitalize mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>

                  {review.areas_to_improve?.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Areas to Improve</p>
                      <ul className="space-y-1 text-xs">
                        {review.areas_to_improve.map((item, idx) => (
                          <li key={idx} className="text-slate-400 flex items-start gap-1.5 font-semibold">
                            <span className="text-slate-600 mt-0.5">•</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {review.goals_next_month?.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Next Month&apos;s Goals</p>
                      <ul className="space-y-1 text-xs">
                        {review.goals_next_month.map((item, idx) => (
                          <li key={idx} className="text-indigo-300 flex items-start gap-1.5 font-bold">
                            <span className="text-indigo-600 mt-0.5">→</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ) : (
                <div className="rounded-3xl border border-white/[0.04] bg-slate-900/20 p-6 text-center space-y-2 backdrop-blur-xl">
                  <Sparkles className="h-6 w-6 text-slate-600 mx-auto" aria-hidden="true" />
                  <p className="text-xs text-slate-500">Complete more check-ins to generate your monthly AI review.</p>
                </div>
              )}

              {/* Correlations */}
              {correlations ? (
                <Card className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
                    <BarChart3 className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">Habit Correlations</h2>
                  </div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Statistical associations in logs</p>

                  <div className="space-y-3">
                    <CorrelationCard
                      label="Sleep vs Stress"
                      strength={correlations.sleep_vs_stress?.strength}
                      explanation={correlations.sleep_vs_stress?.explanation}
                    />
                    <CorrelationCard
                      label="Exercise vs Mood"
                      strength={correlations.exercise_vs_mood?.strength}
                      explanation={correlations.exercise_vs_mood?.explanation}
                    />
                    <CorrelationCard
                      label="Meditation vs Anxiety"
                      strength={correlations.meditation_vs_anxiety?.strength}
                      explanation={correlations.meditation_vs_anxiety?.explanation}
                    />
                  </div>

                  <div className="flex items-start gap-2 bg-amber-500/[0.04] border border-amber-500/10 text-amber-400/80 text-[10px] p-3 rounded-2xl leading-relaxed italic">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
                    <span>Correlations describe patterns in your logs and do not establish causation.</span>
                  </div>
                </Card>
              ) : (
                <div className="rounded-3xl border border-white/[0.04] bg-slate-900/20 p-6 text-center space-y-2 backdrop-blur-xl">
                  <TrendingUp className="h-6 w-6 text-slate-600 mx-auto" aria-hidden="true" />
                  <p className="text-xs text-slate-500">Log more check-ins to compute habit correlations.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
