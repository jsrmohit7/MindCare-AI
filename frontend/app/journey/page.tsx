"use client";

import React, { useState, useEffect, useCallback } from "react";
import { journeyService, JourneyEvent, MonthlyReview, CorrelationsState } from "@/services/journey";
import { dailyWellnessService } from "@/services/dailyWellness";
import { Sparkles, TrendingUp, ShieldAlert, Award, FileText, CheckCircle2, MessageSquare, Activity, Clock } from "lucide-react";

export default function JourneyPage() {
  const [timeline, setTimeline] = useState<JourneyEvent[]>([]);
  const [review, setReview] = useState<MonthlyReview | null>(null);
  const [correlations, setCorrelations] = useState<CorrelationsState | null>(null);
  const [filterRange, setFilterRange] = useState("month");
  
  // Summary Stats
  const [stats, setStats] = useState({
    totalCheckins: 0,
    currentStreak: 0,
    longestStreak: 0,
    firstDate: "N/A"
  });

  const [loading, setLoading] = useState(true);

  const loadJourneyData = useCallback(async () => {
    try {
      const [timelineRes, reviewRes, correlationsRes, streakRes, historyRes] = await Promise.all([
        journeyService.getJourneyTimeline(filterRange),
        journeyService.getMonthlyReview(),
        journeyService.getCorrelations(),
        dailyWellnessService.getStreak(),
        dailyWellnessService.getHistory()
      ]);

      setTimeline(timelineRes);
      setReview(reviewRes);
      setCorrelations(correlationsRes);
      
      const checkinCount = streakRes.total_checkins;
      const currentStr = streakRes.current_streak;
      const longestStr = streakRes.longest_streak;
      const firstCheckin = historyRes.length > 0 ? historyRes[historyRes.length - 1].date : "N/A";
      
      setStats({
        totalCheckins: checkinCount,
        currentStreak: currentStr,
        longestStreak: longestStr,
        firstDate: firstCheckin
      });

    } catch (err) {
      console.error("Failed to load journey timeline & correlations:", err);
    } finally {
      setLoading(false);
    }
  }, [filterRange]);

  useEffect(() => {
    loadJourneyData();
  }, [loadJourneyData]);




  const getEventIcon = (type: string) => {
    switch (type) {
      case "assessment":
        return <FileText className="h-4 w-4 text-sky-400" />;
      case "checkin":
        return <Activity className="h-4 w-4 text-emerald-400" />;
      case "coach":
        return <MessageSquare className="h-4 w-4 text-indigo-400" />;
      case "journal":
        return <Clock className="h-4 w-4 text-purple-400" />;
      case "goal":
        return <CheckCircle2 className="h-4 w-4 text-pink-400" />;
      case "achievement":
        return <Award className="h-4 w-4 text-amber-400 font-bold" />;
      default:
        return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              🚀 Personal Wellness Journey
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Visualize your timeline milestones, track cognitive habits, and review monthly progress.
            </p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 text-xs font-semibold">
            {["today", "week", "month"].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRange(r)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  filterRange === r ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="text-center py-24 text-slate-500 text-sm">Compiling your timeline and analytics...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Timeline & Stats */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Wellness Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                <div className="text-center space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">First Check-in</span>
                  <span className="text-sm font-bold text-slate-200">{stats.firstDate}</span>
                </div>
                <div className="text-center space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total logs</span>
                  <span className="text-sm font-bold text-slate-200">{stats.totalCheckins}</span>
                </div>
                <div className="text-center space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Current streak</span>
                  <span className="text-sm font-bold text-slate-200">{stats.currentStreak} Days</span>
                </div>
                <div className="text-center space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Best streak</span>
                  <span className="text-sm font-bold text-slate-200">{stats.longestStreak} Days</span>
                </div>
              </div>

              {/* Journey Timeline */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-400 animate-pulse" />
                  Journey Milestones ({timeline.length})
                </h2>

                {timeline.length === 0 ? (
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-12 text-center text-slate-500 text-xs">
                    No activity registered in this range. Keep completing assessments and check-ins.
                  </div>
                ) : (
                  <div className="relative border-l border-white/10 pl-6 ml-3 space-y-6 text-xs text-left">
                    {timeline.map((event) => (
                      <div key={event._id} className="relative">
                        {/* Event Dot */}
                        <div className="absolute -left-[35px] top-0.5 bg-slate-900 border border-white/10 rounded-full p-1.5 shadow">
                          {getEventIcon(event.event_type)}
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-1.5 hover:bg-white/10 transition-all">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-bold uppercase tracking-wider text-indigo-300">{event.event_type}</span>
                            <span>{new Date(event.timestamp).toLocaleString()}</span>
                          </div>
                          <h4 className="font-bold text-slate-200 text-sm leading-snug">{event.title}</h4>
                          <p className="text-slate-400 leading-relaxed">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Monthly Review & Correlations */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* Monthly AI Review Panel */}
              {review && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-purple-300">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                      Monthly AI Review ({review.month})
                    </h2>
                    <span className="text-[18px] bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded font-extrabold text-purple-300">
                      {review.monthly_wellness_score}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 italic leading-relaxed border-l-2 border-purple-500/40 pl-3">
                    &ldquo;{review.ai_summary}&rdquo;
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-[11px] pt-2 border-t border-white/5 text-slate-300">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase">Stress Trend</span>
                      <span className="capitalize">{review.stress_trend}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase">Sleep cycles</span>
                      <span className="capitalize">{review.sleep_trend}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase">Mood distribution</span>
                      <span className="capitalize">{review.mood_trend}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase">Physical activities</span>
                      <span>{review.exercise_trend}</span>
                    </div>
                  </div>

                  {review.areas_to_improve?.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Areas to Improve</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                        {review.areas_to_improve.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {review.goals_next_month?.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Goals next month</span>
                      <ul className="list-disc list-inside space-y-0.5 text-indigo-300 font-medium">
                        {review.goals_next_month.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Correlations Panel */}
              {correlations && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4 text-left">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-indigo-400 animate-pulse" />
                      Habit Correlation Dashboard
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Identified statistical associations across your logged entries.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {/* Sleep vs Stress */}
                    <div className="bg-slate-950/40 border border-white/5 p-3 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">Sleep vs Stress levels</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded capitalize ${
                          correlations.sleep_vs_stress.strength === "strong"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {correlations.sleep_vs_stress.strength} Correlation
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{correlations.sleep_vs_stress.explanation}</p>
                    </div>

                    {/* Exercise vs Mood */}
                    <div className="bg-slate-950/40 border border-white/5 p-3 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">Exercise vs Mood boost</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded capitalize ${
                          correlations.exercise_vs_mood.strength === "strong"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {correlations.exercise_vs_mood.strength} Correlation
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{correlations.exercise_vs_mood.explanation}</p>
                    </div>

                    {/* Meditation vs Anxiety */}
                    <div className="bg-slate-950/40 border border-white/5 p-3 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">Meditation vs Anxiety relief</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded capitalize ${
                          correlations.meditation_vs_anxiety.strength === "strong"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {correlations.meditation_vs_anxiety.strength} Correlation
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{correlations.meditation_vs_anxiety.explanation}</p>
                    </div>
                  </div>

                  {/* Non-causality disclaimer */}
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] p-3 rounded-xl flex items-start gap-2 italic">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      Disclaimer: These statistics describe historical correlations observed in your logs. They do not constitute scientific proof of causation.
                    </span>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}
        
      </div>
    </main>
  );
}
