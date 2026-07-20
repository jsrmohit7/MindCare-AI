"use client";

import React, { useState, useEffect } from "react";
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
  Settings 
} from "lucide-react";
import Link from "next/link";
import { dailyWellnessService, DailyCheckInRecord } from "@/services/dailyWellness";
import NearbyProfessionals from "@/components/NearbyProfessionals";

// Lazy load analytics charts to avoid blocking Next.js initial SSR render
const AnalyticsCharts = dynamic(() => import("@/components/daily-checkin/AnalyticsCharts"), {
  ssr: false,
  loading: () => <div className="h-[320px] w-full rounded-2xl bg-white/5 animate-pulse" />
});

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Assessments history hook
  const { data: assessments, isLoading: loadingAssessments } = useAssessments(5);

  // Daily Checkin States
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState<DailyCheckInRecord | null>(null);
  
  const [streak, setStreak] = useState({
    current_streak: 0,
    longest_streak: 0,
    total_checkins: 0
  });

  const [analyticsData, setAnalyticsData] = useState<DailyCheckInRecord[]>([]);
  const [loadingWellness, setLoadingWellness] = useState(true);

  useEffect(() => {
    loadWellnessDashboard();
  }, []);

  const loadWellnessDashboard = async () => {
    try {
      const todayRes = await dailyWellnessService.getTodayCheckIn();
      setTodayCheckedIn(todayRes.checked_in);
      setTodayRecord(todayRes.data);

      const streakRes = await dailyWellnessService.getStreak();
      setStreak(streakRes);

      const analyticsRes = await dailyWellnessService.getAnalytics();
      setAnalyticsData(analyticsRes);
    } catch (e) {
      console.error("Failed to load wellness dashboard metrics:", e);
    } finally {
      setLoadingWellness(false);
    }
  };

  // Compute progress comparison metrics
  const progressMetrics = React.useMemo(() => {
    if (analyticsData.length < 2) return null;
    
    // Sort ascending by date to get chronological last two
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
      trend
    };
  }, [analyticsData]);

  // Extract latest assessment metrics
  const latestAssessment = React.useMemo(() => {
    if (!assessments || assessments.length === 0) return null;
    return assessments[0];
  }, [assessments]);

  return (
    <ProtectedRoute>
      <div className="space-y-8 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 1. Welcome Back Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-12 h-36 w-36 rounded-full bg-pink-500/5 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                <Sparkles className="h-3 w-3 animate-spin" />
                <span>MindCare Wellness Companion Active</span>
              </div>
              <h1 className="bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
                Welcome back, {user?.full_name || "User"}
              </h1>
              <p className="max-w-2xl text-slate-400 text-sm sm:text-base leading-relaxed">
                Take a moment to check in. Tracking daily habits helps you identify mood patterns and build long-term stress resilience.
              </p>
            </div>
            
            <div className="flex shrink-0 items-center space-x-3 rounded-2xl bg-white/5 p-4 border border-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                <Flame className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Streak</div>
                <div className="text-xl font-black text-white">{streak.current_streak} Days</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 2. Today's Wellness Widget */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>🌿 Today&apos;s Wellness</span>
              </h2>
              {todayCheckedIn && (
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  Completed
                </span>
              )}
            </div>

            {loadingWellness ? (
              <div className="h-44 flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : !todayCheckedIn ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <Heart className="h-10 w-10 text-slate-600 animate-pulse" />
                <div className="space-y-1">
                  <p className="font-semibold text-slate-300 text-sm">No check-in completed today</p>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Take 30 seconds to record your mood, stress, sleep, and hydration parameters.
                  </p>
                </div>
                <Link
                  href="/daily-checkin"
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/15"
                >
                  Complete Daily Check-In
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Circular Score Gauge */}
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/5 bg-slate-950 shadow-inner">
                    {/* Glowing outer aura */}
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/40 animate-pulse" />
                    <div className="text-center">
                      <span className="text-3xl font-black text-indigo-300">{todayRecord?.wellness_score}</span>
                      <span className="text-[10px] text-slate-500 font-bold block">Score</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">Today&apos;s Balance</span>
                </div>

                {/* Parameters list grid */}
                <div className="md:col-span-2 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/5 p-3 rounded-xl flex items-center space-x-2.5">
                    <Smile className="h-5 w-5 text-indigo-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Mood</div>
                      <div className="font-bold text-slate-200">{todayRecord?.mood}</div>
                    </div>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl flex items-center space-x-2.5">
                    <Activity className="h-5 w-5 text-pink-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Stress</div>
                      <div className="font-bold text-slate-200">{todayRecord?.stress}/10</div>
                    </div>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl flex items-center space-x-2.5">
                    <Clock className="h-5 w-5 text-blue-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Sleep</div>
                      <div className="font-bold text-slate-200 truncate">{todayRecord?.sleep}</div>
                    </div>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl flex items-center space-x-2.5">
                    <Droplet className="h-5 w-5 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Water</div>
                      <div className="font-bold text-slate-200">{todayRecord?.water}</div>
                    </div>
                  </div>
                </div>

                {/* AI report summary */}
                {todayRecord?.ai_summary && (
                  <div className="md:col-span-3 rounded-xl border border-white/5 bg-slate-950/40 p-4 text-xs space-y-2 text-left">
                    <div className="flex items-center space-x-1.5 font-bold text-indigo-400 uppercase tracking-wider">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Today&apos;s AI Summary</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed italic">
                      &ldquo;{todayRecord.ai_summary}&rdquo;
                    </p>
                    {todayRecord.daily_goal && (
                      <p className="text-slate-400 font-semibold pt-1 border-t border-white/5">
                        🎯 <span className="font-bold text-slate-300">Goal:</span> {todayRecord.daily_goal}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="md:col-span-3 pt-2">
                  <Link
                    href="/daily-checkin"
                    className="w-full justify-center inline-flex items-center rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 border border-white/10 transition-all"
                  >
                    <span>View Report Details / Edit Check-In</span>
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 3. Wellness Progress comparison */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4 shadow-xl backdrop-blur-xl">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>📈 Wellness Progress</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compare today&apos;s wellness index to your preceding check-in record.
              </p>
            </div>

            {loadingWellness ? (
              <div className="h-28 flex items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : !progressMetrics ? (
              <div className="rounded-xl bg-white/5 p-4 text-center text-xs text-slate-500">
                Complete more daily check-ins to view your progress trends.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Current Score</span>
                    <span className="text-3xl font-black text-white">{progressMetrics.currentScore}%</span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Previous Score</span>
                    <span className="text-xl font-bold text-slate-400">{progressMetrics.previousScore}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs">
                  <span className="text-slate-400 font-semibold">Change Indicator:</span>
                  <div className="flex items-center space-x-1.5">
                    {progressMetrics.trend === "improving" ? (
                      <span className="flex items-center space-x-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-bold text-emerald-400 border border-emerald-500/20">
                        <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                        <span>⬆ Improved (+{progressMetrics.diff}%)</span>
                      </span>
                    ) : progressMetrics.trend === "needs_attention" ? (
                      <span className="flex items-center space-x-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 font-bold text-rose-400 border border-rose-500/20">
                        <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                        <span>⬇ Reduced (-{progressMetrics.diff}%)</span>
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-500/10 px-2.5 py-0.5 font-bold text-slate-400 border border-slate-500/20">
                        ➡ Stable
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/daily-history"
                className="w-full justify-center inline-flex items-center rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/10 border border-white/10 transition-all"
              >
                <span>View Full History logs</span>
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Analytics Charts Component wrapper */}
        {!loadingWellness && analyticsData.length > 0 && (
          <div className="w-full">
            <AnalyticsCharts data={analyticsData} />
          </div>
        )}

        {/* 4. Latest Assessment widget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Latest Assessment score card */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4 shadow-xl backdrop-blur-xl">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-indigo-400" />
                <span>🧠 Latest Mental Health Assessment</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review score indexes from your most recent PHQ-9 & GAD-7 clinical questionnaires.
              </p>
            </div>

            {loadingAssessments ? (
              <div className="h-24 flex items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : !latestAssessment ? (
              <div className="rounded-xl bg-white/5 p-4 text-center text-xs text-slate-500">
                You haven&apos;t completed any assessments yet.
              </div>
            ) : (
              <div className="space-y-3 border-t border-white/5 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Evaluation Date:</span>
                  <span className="font-bold text-slate-200">
                    {latestAssessment.metadata?.generated_at?.split("T")[0] || "Recent"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Anxiety Risk:</span>
                  <span className="font-bold text-indigo-300">
                    {latestAssessment.risk_profile?.overall_risk?.level || "Minimal"}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Link
                href={latestAssessment ? `/results/${latestAssessment.id}` : "/assessment"}
                className="w-full justify-center inline-flex items-center rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-white/10 border border-white/10 transition-all"
              >
                <span>{latestAssessment ? "View Assessment Details" : "Take First Assessment"}</span>
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* 5. Daily Streak counters widgets */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4 shadow-xl backdrop-blur-xl">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Flame className="h-5 w-5 text-amber-500" />
                <span>🔥 Wellness Streaks & Milestones</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Unlock badges and milestones by logging consecutive daily checks.
              </p>
            </div>

            {loadingWellness ? (
              <div className="h-24 flex items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="bg-white/5 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Longest Streak</span>
                  <span className="text-lg font-black text-slate-200 mt-1 block">{streak.longest_streak} Days</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Logs</span>
                  <span className="text-lg font-black text-slate-200 mt-1 block">{streak.total_checkins} checkins</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-center border-t border-white/5 pt-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                streak.total_checkins >= 7 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-white/5 text-slate-600 border-white/5"
              }`}>
                🥉 7 Days
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                streak.total_checkins >= 30 ? "bg-slate-300/10 text-slate-300 border-slate-300/20" : "bg-white/5 text-slate-600 border-white/5"
              }`}>
                🥈 30 Days
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                streak.total_checkins >= 100 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-white/5 text-slate-600 border-white/5"
              }`}>
                🥇 100 Days
              </span>
            </div>
          </div>
        </div>

        {/* 6. Dedicated Nearby Mental Health Professionals Widget */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl">
          <NearbyProfessionals severity={latestAssessment?.risk_profile?.overall_risk?.level || "Minimal"} />
        </div>

        {/* Quick Actions Grid list */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-4 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 pb-2">
            ⚡ Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              href="/assessment"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-white/5 text-center transition-all hover:bg-white/10 hover:border-indigo-500/20"
            >
              <ClipboardList className="h-5 w-5 text-indigo-400 mb-2" />
              <span className="text-xs font-bold text-white">Take Assessment</span>
            </Link>
            <Link
              href="/daily-checkin"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-white/5 text-center transition-all hover:bg-white/10 hover:border-pink-500/20"
            >
              <Heart className="h-5 w-5 text-pink-400 mb-2" />
              <span className="text-xs font-bold text-white">Complete Check-In</span>
            </Link>
            <Link
              href="/daily-history"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-white/5 text-center transition-all hover:bg-white/10 hover:border-blue-500/20"
            >
              <History className="h-5 w-5 text-blue-400 mb-2" />
              <span className="text-xs font-bold text-white">View History</span>
            </Link>
            <Link
              href="/settings"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-white/5 text-center transition-all hover:bg-white/10 hover:border-emerald-500/20"
            >
              <Settings className="h-5 w-5 text-emerald-400 mb-2" />
              <span className="text-xs font-bold text-white">Reminder Settings</span>
            </Link>
          </div>
        </div>

        {/* General Disclaimer */}
        <div className="flex items-start space-x-3 rounded-2xl border border-white/5 bg-slate-950/40 p-5 text-xs text-slate-500">
          <ShieldAlert className="h-5 w-5 shrink-0 text-slate-400" />
          <p className="leading-relaxed">
            <strong>Disclaimer:</strong> MindCare AI assessments and daily tracking metrics are compiled for self-coaching and educational purposes. They do not constitute formal psychiatric advice or clinical diagnosis. If you are experiencing a mental health emergency, please immediately call emergency services or visit the nearest healthcare facility.
          </p>
        </div>

      </div>
    </ProtectedRoute>
  );
}
