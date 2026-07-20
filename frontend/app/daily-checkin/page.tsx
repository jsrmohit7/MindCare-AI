"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { 
  Smile, 
  Frown, 
  Meh, 
  SmilePlus, 
  FileText, 
  ArrowLeft,
  Sparkles,
  Award,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { dailyWellnessService, DailyCheckInPayload } from "@/services/dailyWellness";

export default function DailyCheckInPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingRecord, setExistingRecord] = useState(false);
  
  // Form States
  const [mood, setMood] = useState<string>("Neutral");
  const [stress, setStress] = useState<number>(5);
  const [anxiety, setAnxiety] = useState<number>(5);
  const [sleep, setSleep] = useState<string>("6–8 Hours");
  
  const [exercise, setExercise] = useState<boolean>(false);
  const [exerciseMinutes, setExerciseMinutes] = useState<number>(20);
  
  const [water, setWater] = useState<string>("1–2L");
  const [meals, setMeals] = useState<string>("Normal");
  
  const [meditation, setMeditation] = useState<boolean>(false);
  const [meditationMinutes, setMeditationMinutes] = useState<number>(10);
  
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Success summary modal
  const [showSuccess, setShowSuccess] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    score: number;
    ai_summary?: string;
    motivation?: string;
    daily_goal?: string;
  } | null>(null);

  useEffect(() => {
    loadTodayCheckIn();
  }, []);

  const loadTodayCheckIn = async () => {
    try {
      const res = await dailyWellnessService.getTodayCheckIn();
      if (res.checked_in && res.data) {
        setExistingRecord(true);
        const d = res.data;
        setMood(d.mood);
        setStress(d.stress);
        setAnxiety(d.anxiety);
        setSleep(d.sleep);
        setExercise(d.exercise);
        setExerciseMinutes(d.exercise_minutes);
        setWater(d.water);
        setMeals(d.meals);
        setMeditation(d.meditation);
        setMeditationMinutes(d.meditation_minutes);
        setNotes(d.notes || "");
      }
    } catch (e) {
      console.error("Failed to load today's check-in status:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: DailyCheckInPayload = {
      mood,
      stress,
      anxiety,
      sleep,
      exercise,
      exercise_minutes: exercise ? exerciseMinutes : 0,
      water,
      meals,
      meditation,
      meditation_minutes: meditation ? meditationMinutes : 0,
      notes: notes.trim() || undefined
    };

    try {
      let res;
      if (existingRecord) {
        res = await dailyWellnessService.updateTodayCheckIn(payload);
      } else {
        res = await dailyWellnessService.submitCheckIn(payload);
      }

      setSummaryData({
        score: res.wellness_score,
        ai_summary: res.ai_summary,
        motivation: res.motivation,
        daily_goal: res.daily_goal
      });
      setShowSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Failed to submit check-in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto" />
            <p className="text-slate-400 text-sm font-semibold">Loading parameters...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto space-y-8 py-6">
        {/* Navigation header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-xs text-slate-500 font-bold bg-white/5 border border-white/5 rounded-full px-3.5 py-1">
            UTC Date: {new Date().toISOString().split("T")[0]}
          </span>
        </div>

        {/* Existing records reminder alert */}
        {existingRecord && (
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/10 p-5 flex items-start space-x-3 text-indigo-300">
            <Sparkles className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="text-sm leading-relaxed">
              <strong>Check-In Completed:</strong> You have already recorded today&apos;s check-in metrics. Modifying values below will update your score and generate a refreshed Granite AI wellness report.
            </div>
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <h1 className="bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            🌿 Daily Wellness Check-In
          </h1>
          <p className="text-slate-400 text-sm">
            Check-in with yourself. Tracking daily metrics builds your active streak and compiles monthly health trend reports.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Mood Picker */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-4">
            <label className="text-base font-bold text-white block">
              😊 How are you feeling today?
            </label>
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: "Very Happy", emoji: SmilePlus, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40" },
                { label: "Happy", emoji: Smile, color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/40" },
                { label: "Neutral", emoji: Meh, color: "text-slate-400 border-slate-500/20 bg-slate-500/5 hover:border-slate-500/40" },
                { label: "Sad", emoji: Frown, color: "text-amber-400 border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40" },
                { label: "Very Sad", emoji: Frown, color: "text-red-400 border-red-500/20 bg-red-500/5 hover:border-red-500/40" }
              ].map((item) => {
                const Icon = item.emoji;
                const isSelected = mood === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setMood(item.label)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-300 ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-500 text-white scale-105 shadow-lg shadow-indigo-500/20"
                        : `${item.color} text-slate-400`
                    }`}
                  >
                    <Icon className="h-7 w-7 mb-2" />
                    <span className="text-[10px] sm:text-xs font-bold leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Stress & Anxiety Slider Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stress level */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-base font-bold text-white">😟 Stress Level</label>
                <span className="text-sm font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  {stress}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={stress}
                onChange={(e) => setStress(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                <span>Minimal</span>
                <span>Moderate</span>
                <span>Extreme</span>
              </div>
            </div>

            {/* Anxiety level */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-base font-bold text-white">😰 Anxiety Level</label>
                <span className="text-sm font-extrabold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full">
                  {anxiety}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={anxiety}
                onChange={(e) => setAnxiety(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                <span>Minimal</span>
                <span>Moderate</span>
                <span>Extreme</span>
              </div>
            </div>
          </div>

          {/* 3. Sleep & Hydration Options */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-6">
            {/* Sleep options */}
            <div className="space-y-3">
              <label className="text-base font-bold text-white block">😴 Sleep Duration</label>
              <div className="flex flex-wrap gap-2">
                {["Less than 4 Hours", "4–6 Hours", "6–8 Hours", "More than 8 Hours"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSleep(opt)}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold border transition-all duration-300 ${
                      sleep === opt
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/15"
                        : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Hydration intake */}
            <div className="space-y-3">
              <label className="text-base font-bold text-white block">💧 Water Intake</label>
              <div className="flex flex-wrap gap-2">
                {["Less than 1L", "1–2L", "2–3L", "More than 3L"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setWater(opt)}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold border transition-all duration-300 ${
                      water === opt
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/15"
                        : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Exercise, Meals, Meditation */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-6">
            {/* Exercise Switch */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="space-y-0.5">
                <label className="text-base font-bold text-white">🏃 Physical Exercise</label>
                <p className="text-xs text-slate-400">Did you engage in any active workout today?</p>
              </div>
              <button
                type="button"
                onClick={() => setExercise(!exercise)}
                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${
                  exercise ? "bg-indigo-600" : "bg-slate-950 border border-white/10"
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-full bg-white transition-transform duration-300 ${
                    exercise ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>

            {/* Exercise Minutes Form input */}
            {exercise && (
              <div className="flex items-center justify-between border-b border-white/5 pb-4 animate-fadeIn">
                <label className="text-sm font-semibold text-slate-300">Minutes Exercised:</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={exerciseMinutes}
                  onChange={(e) => setExerciseMinutes(parseInt(e.target.value) || 0)}
                  className="w-24 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-center text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Meditation Switch */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="space-y-0.5">
                <label className="text-base font-bold text-white">🧘 Meditation / Mindfulness</label>
                <p className="text-xs text-slate-400">Did you spend quiet time in reflection today?</p>
              </div>
              <button
                type="button"
                onClick={() => setMeditation(!meditation)}
                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${
                  meditation ? "bg-indigo-600" : "bg-slate-950 border border-white/10"
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-full bg-white transition-transform duration-300 ${
                    meditation ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>

            {/* Meditation Minutes Form input */}
            {meditation && (
              <div className="flex items-center justify-between border-b border-white/5 pb-4 animate-fadeIn">
                <label className="text-sm font-semibold text-slate-300">Minutes Meditated:</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={meditationMinutes}
                  onChange={(e) => setMeditationMinutes(parseInt(e.target.value) || 0)}
                  className="w-24 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-center text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Meals consistency */}
            <div className="space-y-3">
              <label className="text-base font-bold text-white block">🍽 Meals Consistency</label>
              <div className="flex flex-wrap gap-2">
                {["Skipped", "Normal", "Healthy"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setMeals(opt)}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold border transition-all duration-300 ${
                      meals === opt
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/15"
                        : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Notes Text Area */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-base font-bold text-white flex items-center space-x-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                <span>📝 Daily Notes (Optional)</span>
              </label>
              <span className={`text-[10px] font-bold ${notes.length > 450 ? "text-rose-400" : "text-slate-500"}`}>
                {notes.length} / 500
              </span>
            </div>
            <textarea
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reflect on your day, achievements, challenges, or thoughts..."
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all leading-relaxed"
            />
          </div>

          {/* Error feedback */}
          {error && (
            <div className="flex items-center space-x-2 rounded-xl bg-rose-500/15 border border-rose-500/20 p-4 text-sm text-rose-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-pink-500 hover:brightness-110 text-white py-3.5 px-6 font-bold tracking-wide shadow-lg shadow-indigo-500/20 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Generating AI wellness report...</span>
              </div>
            ) : existingRecord ? (
              "Update Today's Check-in"
            ) : (
              "Save Today's Check-in"
            )}
          </button>
        </form>
      </div>

      {/* Success Modal Popup Dialog */}
      {showSuccess && summaryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 md:p-8 space-y-6 shadow-2xl relative text-center">
            {/* Header badges */}
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl">
                <Award className="h-9 w-9 animate-bounce" />
              </div>
            </div>

            {/* Score */}
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">Daily Wellness Completed!</h3>
              <p className="text-xs text-slate-400">Check-in successfully saved to your history timeline.</p>
              <div className="pt-4">
                <span className="inline-flex items-center justify-center rounded-full bg-indigo-500/10 px-4 py-2 border border-indigo-500/20">
                  <span className="text-2xl font-black text-indigo-300">{summaryData.score}</span>
                  <span className="text-xs text-slate-500 font-bold ml-1">/ 100 Score</span>
                </span>
              </div>
            </div>

            {/* AI Report Card */}
            {summaryData.ai_summary && (
              <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-5 text-left space-y-3.5">
                <div className="flex items-center space-x-1.5 text-xs text-indigo-400 font-bold uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  <span>watsonx.ai Daily Insights</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {summaryData.ai_summary}
                </p>
                {summaryData.daily_goal && (
                  <div className="border-t border-white/5 pt-3">
                    <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Tomorrow&apos;s Goal</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{summaryData.daily_goal}</p>
                  </div>
                )}
              </div>
            )}

            {/* Button */}
            <button
              onClick={() => {
                setShowSuccess(false);
                router.push("/dashboard");
              }}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-all duration-300"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
