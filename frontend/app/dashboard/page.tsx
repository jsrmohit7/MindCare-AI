"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useAssessments } from "@/hooks/useAssessments";
import {
  ClipboardList,
  History,
  Heart,
  ShieldAlert,
  Sparkles,
  Flame,
  TrendingUp,
  TrendingDown,
  Activity,
  Smile,
  Droplet,
  Clock,
  BookOpen,
  ChevronRight,
  Stethoscope,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { dailyWellnessService, DailyCheckInRecord } from "@/services/dailyWellness";
import { SkeletonLine } from "@/components/SkeletonCard";
import AchievementBadge, { computeAchievements } from "@/components/AchievementBadge";

// Lazy load heavy components
const AnalyticsCharts = dynamic(
  () => import("@/components/daily-checkin/AnalyticsCharts"),
  {
    ssr: false,
    loading: () => <div className="h-[320px] w-full rounded-2xl bg-white/5 animate-pulse" aria-hidden="true" />,
  }
);

const WellnessCalendar = dynamic(
  () => import("@/components/WellnessCalendar"),
  {
    ssr: false,
    loading: () => <div className="h-[320px] w-full rounded-2xl bg-white/5 animate-pulse" aria-hidden="true" />,
  }
);

// Greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Today's date formatted
function getTodayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Progress comparison arrow icon
function TrendArrow({ trend }: { trend: "better" | "same" | "worse" }) {
  if (trend === "better")
    return (
      <span className="inline-flex items-center text-emerald-400 font-bold text-xs gap-0.5">
        <ArrowUp className="h-3 w-3" /> Better
      </span>
    );
  if (trend === "worse")
    return (
      <span className="inline-flex items-center text-rose-400 font-bold text-xs gap-0.5">
        <ArrowDown className="h-3 w-3" /> Needs Improvement
      </span>
    );
  return (
    <span className="inline-flex items-center text-slate-400 font-bold text-xs gap-0.5">
      <Minus className="h-3 w-3" /> Same
    </span>
  );
}

function getTrend(current?: number, previous?: number): "better" | "same" | "worse" {
  if (current === undefined || previous === undefined) return "same";
  if (current > previous + 3) return "better";
  if (current < previous - 3) return "worse";
  return "same";
}

const MOOD_SCALE = ["Very Happy", "Happy", "Neutral", "Sad", "Very Sad"];
function getMoodTrend(currentMood: string, previousMood: string): "better" | "same" | "worse" {
  const currentIdx = MOOD_SCALE.indexOf(currentMood);
  const previousIdx = MOOD_SCALE.indexOf(previousMood);
  if (currentIdx < 0 || previousIdx < 0) return "same";
  // Lower index = better mood (Very Happy = 0, Very Sad = 4)
  if (currentIdx < previousIdx) return "better";
  if (currentIdx > previousIdx) return "worse";
  return "same";
}


// Modal for calendar day click
function DayReportModal({
  record,
  onClose,
}: {
  record: DailyCheckInRecord;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Wellness report for ${record.date}`}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Daily Report</p>
            <h3 className="text-lg font-extrabold text-white">{record.date}</h3>
          </div>
          <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/20">
            Score: {record.wellness_score}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[
            { label: "Mood", value: record.mood },
            { label: "Stress", value: `${record.stress}/10` },
            { label: "Sleep", value: record.sleep },
            { label: "Anxiety", value: `${record.anxiety}/10` },
            { label: "Water", value: record.water },
            { label: "Exercise", value: record.exercise ? `${record.exercise_minutes} mins` : "No" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/5 p-3 rounded-xl">
              <p className="text-[10px] text-slate-500 font-bold uppercase">{label}</p>
              <p className="font-semibold text-slate-200 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
        {record.ai_summary && (
          <div className="rounded-xl bg-indigo-950/20 border border-indigo-500/10 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase">
              <Sparkles className="h-3.5 w-3.5" /> AI Insight
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{record.ai_summary}</p>
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 py-2.5 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: assessments, isLoading: loadingAssessments } = useAssessments(5);

  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState<DailyCheckInRecord | null>(null);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0, total_checkins: 0 });
  const [analyticsData, setAnalyticsData] = useState<DailyCheckInRecord[]>([]);
  const [historyData, setHistoryData] = useState<DailyCheckInRecord[]>([]);
  const [loadingWellness, setLoadingWellness] = useState(true);
  const [calendarRecord, setCalendarRecord] = useState<DailyCheckInRecord | null>(null);

  useEffect(() => {
    loadWellnessDashboard();
  }, []);

  const loadWellnessDashboard = async () => {
    try {
      const [todayRes, streakRes, analyticsRes, historyRes] = await Promise.all([
        dailyWellnessService.getTodayCheckIn(),
        dailyWellnessService.getStreak(),
        dailyWellnessService.getAnalytics(),
        dailyWellnessService.getHistory(),
      ]);
      setTodayCheckedIn(todayRes.checked_in);
      setTodayRecord(todayRes.data);
      setStreak(streakRes);
      setAnalyticsData(analyticsRes);
      setHistoryData(historyRes);
    } catch (e) {
      console.error("Failed to load wellness dashboard metrics:", e);
    } finally {
      setLoadingWellness(false);
    }
  };

  // Progress comparison metrics (current vs previous check-in)
  const progressMetrics = useMemo(() => {
    if (analyticsData.length < 2) return null;
    const sorted = [...analyticsData].sort((a, b) => a.date.localeCompare(b.date));
    const current = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];
    const diff = current.wellness_score - previous.wellness_score;
    let trend: "improving" | "stable" | "needs_attention" = "stable";
    if (diff > 3) trend = "improving";
    else if (diff < -3) trend = "needs_attention";
    return {
      currentScore: current.wellness_score,
      previousScore: previous.wellness_score,
      diff: Math.abs(diff),
      isPositive: diff >= 0,
      trend,
      currentMood: current.mood,
      previousMood: previous.mood,
      currentStress: current.stress,
      previousStress: previous.stress,
      currentSleep: current.sleep,
      previousSleep: previous.sleep,
    };
  }, [analyticsData]);

  const latestAssessment = useMemo(() => {
    if (!assessments || assessments.length === 0) return null;
    return assessments[0];
  }, [assessments]);

  // Achievements
  const achievements = useMemo(
    () =>
      computeAchievements({
        totalCheckins: streak.total_checkins,
        currentStreak: streak.current_streak,
        longestStreak: streak.longest_streak,
        hasAssessment: !!latestAssessment,
        analyticsData: analyticsData.map((r) => ({
          mood: r.mood,
          sleep: r.sleep,
          water: r.water,
          exercise: r.exercise,
        })),
      }),
    [streak, latestAssessment, analyticsData]
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <ProtectedRoute>
      <div className="space-y-6 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ——— 1. Welcome Back Banner ——— */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 left-12 h-40 w-40 rounded-full bg-pink-500/5 blur-3xl pointer-events-none" aria-hidden="true" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                <Sparkles className="h-3 w-3 animate-spin" aria-hidden="true" />
                <span>MindCare Wellness Companion</span>
              </div>
              <h1 className="bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
                {getGreeting()}, {user?.full_name?.split(" ")[0] || "there"} 👋
              </h1>
              <p className="text-slate-400 text-sm">{getTodayDate()}</p>
              <p className="max-w-2xl text-slate-500 text-xs sm:text-sm leading-relaxed">
                Track daily habits to build long-term stress resilience and uncover mood patterns.
              </p>
            </div>

            <div className="flex shrink-0 items-center space-x-3 rounded-2xl bg-white/5 p-4 border border-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                <Flame className="h-6 w-6 animate-pulse" aria-hidden="true" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Streak</div>
                <div className="text-2xl font-black text-white">{streak.current_streak} Days</div>
              </div>
            </div>
          </div>
        </div>

        {/* ——— 2. Today's Wellness + Progress ——— */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Today's Wellness */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-lg font-bold text-white">🌿 Today&apos;s Wellness</h2>
              {todayCheckedIn && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  ✓ Completed
                </span>
              )}
            </div>

            {loadingWellness ? (
              <div className="space-y-3">
                <SkeletonLine className="h-28 rounded-xl" />
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => <SkeletonLine key={i} className="h-16 rounded-xl" />)}
                </div>
              </div>
            ) : !todayCheckedIn ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <Heart className="h-10 w-10 text-slate-600 animate-pulse" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="font-semibold text-slate-300 text-sm">No check-in completed today</p>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Take 30 seconds to record your mood, stress, sleep, and hydration.
                  </p>
                </div>
                <Link
                  href="/daily-checkin"
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/15 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  Complete Daily Check-In
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                {/* Circular Score Gauge */}
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/5 bg-slate-950 shadow-inner">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/40 animate-pulse" aria-hidden="true" />
                    <div className="text-center">
                      <span className="text-3xl font-black text-indigo-300">{todayRecord?.wellness_score}</span>
                      <span className="text-[10px] text-slate-500 font-bold block">Score</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">Today&apos;s Balance</span>
                </div>

                {/* Metrics Grid */}
                <div className="md:col-span-2 grid grid-cols-2 gap-3 text-xs">
                  {[
                    { icon: <Smile className="h-5 w-5 text-indigo-400" aria-hidden="true" />, label: "Mood", value: todayRecord?.mood },
                    { icon: <Activity className="h-5 w-5 text-pink-400" aria-hidden="true" />, label: "Stress", value: `${todayRecord?.stress}/10` },
                    { icon: <Clock className="h-5 w-5 text-blue-400" aria-hidden="true" />, label: "Sleep", value: todayRecord?.sleep },
                    { icon: <Droplet className="h-5 w-5 text-cyan-400" aria-hidden="true" />, label: "Water", value: todayRecord?.water },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="bg-white/5 p-3 rounded-xl flex items-center space-x-2.5">
                      {icon}
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">{label}</div>
                        <div className="font-bold text-slate-200 truncate">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Summary */}
                {todayRecord?.ai_summary && (
                  <div className="md:col-span-3 rounded-xl border border-white/5 bg-slate-950/40 p-4 text-xs space-y-2">
                    <div className="flex items-center space-x-1.5 font-bold text-indigo-400 uppercase tracking-wider">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Today&apos;s AI Insight</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed italic">&ldquo;{todayRecord.ai_summary}&rdquo;</p>
                    {todayRecord.daily_goal && (
                      <p className="text-slate-400 font-semibold pt-1 border-t border-white/5">
                        🎯 <span className="font-bold text-slate-300">Goal:</span> {todayRecord.daily_goal}
                      </p>
                    )}
                  </div>
                )}

                <div className="md:col-span-3">
                  <Link
                    href="/daily-checkin"
                    className="w-full justify-center inline-flex items-center rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 border border-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <span>View Report / Edit Check-In</span>
                    <ChevronRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Progress Comparison */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4 shadow-xl backdrop-blur-xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">📈 Progress</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Compare your latest wellness scores.</p>
            </div>

            {loadingWellness ? (
              <div className="space-y-3">
                <SkeletonLine className="h-12 rounded-xl" />
                <SkeletonLine className="h-8 rounded-xl" />
                <SkeletonLine className="h-8 rounded-xl" />
              </div>
            ) : !progressMetrics ? (
              <div className="rounded-xl bg-white/5 p-4 text-center text-xs text-slate-500">
                Complete more daily check-ins to view progress trends.
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Current</span>
                    <span className="text-3xl font-black text-white">{progressMetrics.currentScore}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Previous</span>
                    <span className="text-xl font-bold text-slate-400">{progressMetrics.previousScore}%</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                    <span className="text-slate-400">Trend</span>
                    {progressMetrics.trend === "improving" ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-bold text-emerald-400 border border-emerald-500/20">
                        <TrendingUp className="h-3 w-3" /> ⬆ +{progressMetrics.diff}%
                      </span>
                    ) : progressMetrics.trend === "needs_attention" ? (
                      <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 font-bold text-rose-400 border border-rose-500/20">
                        <TrendingDown className="h-3 w-3" /> ⬇ -{progressMetrics.diff}%
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-500/10 px-2.5 py-0.5 font-bold text-slate-400 border border-slate-500/20">
                        ➡ Stable
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                    <span className="text-slate-400">Mood</span>
                    <TrendArrow trend={getMoodTrend(progressMetrics.currentMood, progressMetrics.previousMood)} />
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-400">Stress</span>
                    <TrendArrow trend={getTrend(progressMetrics.previousStress, progressMetrics.currentStress)} />
                  </div>
                </div>
              </div>
            )}

            <Link
              href="/daily-history"
              className="w-full justify-center inline-flex items-center rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/10 border border-white/10 transition-all"
            >
              View Full History
              <ChevronRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* ——— 3. Analytics Charts ——— */}
        {!loadingWellness && analyticsData.length > 0 && (
          <div className="w-full">
            <AnalyticsCharts data={analyticsData} />
          </div>
        )}

        {/* ——— 4. Latest Assessment + Streak ——— */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Latest Assessment */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4 shadow-xl backdrop-blur-xl">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-400" aria-hidden="true" />
                🧠 Latest Assessment
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review your most recent PHQ-9 &amp; GAD-7 evaluation results.
              </p>
            </div>

            {loadingAssessments ? (
              <SkeletonLine className="h-24 rounded-xl" />
            ) : !latestAssessment ? (
              <div className="rounded-xl bg-white/5 p-4 text-center space-y-3">
                <p className="text-xs text-slate-500">No assessments completed yet.</p>
                <Link
                  href="/assessment"
                  className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all"
                >
                  Take First Assessment
                </Link>
              </div>
            ) : (
              <div className="space-y-3 border-t border-white/5 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Assessment Date</span>
                  <span className="font-bold text-slate-200">
                    {latestAssessment.metadata?.generated_at?.split("T")[0] || "Recent"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Risk Level</span>
                  <span className="font-bold text-indigo-300">
                    {latestAssessment.risk_profile?.overall_risk?.level || "Minimal"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Score</span>
                  <span className="font-bold text-slate-200">
                    {Math.round(latestAssessment.risk_profile?.overall_risk?.score ?? 0)} / 100
                  </span>
                </div>
              </div>
            )}

            <Link
              href={latestAssessment ? `/results/${latestAssessment.id}` : "/assessment"}
              className="w-full justify-center inline-flex items-center rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/10 border border-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {latestAssessment ? "View Full Report" : "Start Assessment"}
              <ChevronRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Streak Widget */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4 shadow-xl backdrop-blur-xl">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-500" aria-hidden="true" />
                🔥 Current Streak
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Build consistency to unlock streak milestones.
              </p>
            </div>

            {loadingWellness ? (
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => <SkeletonLine key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                {[
                  { label: "Current", value: streak.current_streak, unit: "days", color: "text-amber-400" },
                  { label: "Longest", value: streak.longest_streak, unit: "days", color: "text-indigo-300" },
                  { label: "Total", value: streak.total_checkins, unit: "logs", color: "text-emerald-300" },
                ].map(({ label, value, unit, color }) => (
                  <div key={label} className="bg-white/5 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">{label}</span>
                    <span className={`text-lg font-black ${color} block mt-0.5`}>{value}</span>
                    <span className="text-[10px] text-slate-500">{unit}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-center border-t border-white/5 pt-3">
              {[
                { label: "🥉 7 Days", threshold: 7 },
                { label: "🥈 30 Days", threshold: 30 },
                { label: "🥇 100 Days", threshold: 100 },
              ].map(({ label, threshold }) => (
                <span
                  key={threshold}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    streak.total_checkins >= threshold
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-white/5 text-slate-600 border-white/5"
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ——— 5. Achievements ——— */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              🏆 Achievements
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
              {unlockedCount}/{achievements.length} Unlocked
            </span>
          </div>

          {loadingWellness ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <SkeletonLine key={i} className="h-32 rounded-2xl" />)}
            </div>
          ) : achievements.every((a) => !a.unlocked) && streak.total_checkins === 0 ? (
            <div className="text-center py-6 space-y-2">
              <Trophy className="h-10 w-10 text-slate-600 mx-auto" aria-hidden="true" />
              <p className="text-sm text-slate-400 font-semibold">No achievements yet</p>
              <p className="text-xs text-slate-500">Complete daily check-ins to unlock your first achievement.</p>
              <Link
                href="/daily-checkin"
                className="inline-flex items-center mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all"
              >
                Start Today
              </Link>
            </div>
          ) : (
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              role="list"
              aria-label="Achievements"
            >
              {achievements.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          )}
        </div>

        {/* ——— 6. Wellness Calendar ——— */}
        {!loadingWellness && historyData.length > 0 && (
          <div>
            <WellnessCalendar
              history={historyData}
              onDayClick={(record) => setCalendarRecord(record)}
            />
          </div>
        )}

        {/* ——— 7. Quick Actions ——— */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-4 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">
            ⚡ Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" role="list">
            {[
              { href: "/assessment", icon: <ClipboardList className="h-5 w-5 text-indigo-400" />, label: "Assessment", color: "hover:border-indigo-500/20" },
              { href: "/daily-checkin", icon: <Heart className="h-5 w-5 text-pink-400" />, label: "Daily Check-In", color: "hover:border-pink-500/20" },
              { href: "/history", icon: <History className="h-5 w-5 text-blue-400" />, label: "History", color: "hover:border-blue-500/20" },
              { href: "/consult", icon: <Stethoscope className="h-5 w-5 text-emerald-400" />, label: "Consult", color: "hover:border-emerald-500/20" },
            ].map(({ href, icon, label, color }) => (
              <Link
                key={href}
                href={href}
                role="listitem"
                className={`flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-white/5 text-center transition-all duration-200 hover:bg-white/10 ${color} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                aria-label={label}
              >
                {icon}
                <span className="mt-2 text-xs font-bold text-white">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ——— 8. Professional Support CTA ——— */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shrink-0">
                <Stethoscope className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Need Professional Support?</h3>
                <p className="text-xs text-slate-400">Find licensed mental health professionals near you.</p>
              </div>
            </div>
            <Link
              href="/consult"
              className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/15 inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Go to Consult
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* ——— Disclaimer ——— */}
        <div
          className="flex items-start space-x-3 rounded-2xl border border-white/5 bg-slate-950/40 p-5 text-xs text-slate-500"
          role="note"
        >
          <ShieldAlert className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          <p className="leading-relaxed">
            <strong>Disclaimer:</strong> MindCare AI assessments and daily tracking metrics are compiled for
            self-coaching and educational purposes only. They do not constitute formal psychiatric advice
            or clinical diagnosis. If you are experiencing a mental health emergency, please immediately
            call emergency services or visit the nearest healthcare facility.
          </p>
        </div>

      </div>

      {/* Calendar Day Modal */}
      {calendarRecord && (
        <DayReportModal record={calendarRecord} onClose={() => setCalendarRecord(null)} />
      )}
    </ProtectedRoute>
  );
}
