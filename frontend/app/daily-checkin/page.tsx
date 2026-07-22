"use client";

import React, { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useEmotion } from "@/context/EmotionContext";
import { dailyWellnessService, DailyCheckInPayload } from "@/services/dailyWellness";

import { CheckInHero } from "@/components/checkin/CheckInHero";
import { ProgressRing } from "@/components/checkin/ProgressRing";
import { QuestionCard } from "@/components/checkin/QuestionCard";
import { CheckInCompanion } from "@/components/checkin/CheckInCompanion";
import { CompletionScreen } from "@/components/checkin/CompletionScreen";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default function DailyCheckInPage() {
  const { detectedEmotion, refreshEmotionState } = useEmotion();

  // Mounted & Cinematic entrance sequence
  const [mounted, setMounted] = useState(false);
  const [entranceStep, setEntranceStep] = useState(0);

  // Step progression (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Loading & Submission states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingRecord, setExistingRecord] = useState(false);
  const [streakDays, setStreakDays] = useState(0);

  // Form Field States
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

  // Success summary screen state
  const [showSuccess, setShowSuccess] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    score: number;
    ai_summary?: string;
    motivation?: string;
    daily_goal?: string;
  } | null>(null);

  // Staggered entrance animation timer
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

  // Fetch Check-In Data & Streak
  const loadCheckInContext = useCallback(async () => {
    try {
      const [res, streakRes] = await Promise.all([
        dailyWellnessService.getTodayCheckIn(),
        dailyWellnessService.getStreak(),
      ]);

      setStreakDays(streakRes.current_streak || 0);

      if (res.checked_in && res.data) {
        setExistingRecord(true);
        const d = res.data;
        setMood(d.mood || "Neutral");
        setStress(d.stress || 5);
        setAnxiety(d.anxiety || 5);
        setSleep(d.sleep || "6–8 Hours");
        setExercise(!!d.exercise);
        setExerciseMinutes(d.exercise_minutes || 20);
        setWater(d.water || "1–2L");
        setMeals(d.meals || "Normal");
        setMeditation(!!d.meditation);
        setMeditationMinutes(d.meditation_minutes || 10);
        setNotes(d.notes || "");
      } else {
        // Default to current detected emotion baseline if not logged yet
        setMood(detectedEmotion);
      }
    } catch (e) {
      console.error("Failed to load check-in context:", e);
    } finally {
      setLoading(false);
    }
  }, [detectedEmotion]);

  useEffect(() => {
    loadCheckInContext();
  }, [loadCheckInContext]);

  // Form Submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      notes: notes.trim() || undefined,
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
        daily_goal: res.daily_goal,
      });

      // Synchronize emotion context platform-wide
      await refreshEmotionState();
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
          <div className="text-center space-y-3">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-accent border-t-transparent mx-auto" />
            <p className="text-slate-400 text-xs font-semibold">Calibrating daily vitals...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div
        className={`max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8 transition-all duration-700 ${
          mounted ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
        }`}
      >
        {/* Navigation Header Bar */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            <ProgressRing currentStep={currentStep} totalSteps={totalSteps} size={48} strokeWidth={4} />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
        </div>

        {/* Step 1: Living Hero */}
        <div className={`transition-all duration-500 ${entranceStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <CheckInHero
            emotion={mood}
            streakDays={streakDays}
            existingRecord={existingRecord}
            scorePreview={summaryData?.score || 85}
          />
        </div>

        {/* Step 2 & 3: Guided Question Card + AI Companion */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Question Card Column */}
          <div className={`lg:col-span-8 space-y-6 transition-all duration-500 ${entranceStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            
            {existingRecord && (
              <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 text-accent text-xs flex items-center gap-2.5 animate-fadeIn">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Check-In Logged Today:</strong> Updating your choices will recalculate your platform vitals and generate an updated watsonx AI report.
                </span>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <QuestionCard
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1))}
              onPrev={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              onSubmit={handleSubmit}
              submitting={submitting}
              mood={mood}
              setMood={setMood}
              stress={stress}
              setStress={setStress}
              anxiety={anxiety}
              setAnxiety={setAnxiety}
              sleep={sleep}
              setSleep={setSleep}
              water={water}
              setWater={setWater}
              exercise={exercise}
              setExercise={setExercise}
              exerciseMinutes={exerciseMinutes}
              setExerciseMinutes={setExerciseMinutes}
              meditation={meditation}
              setMeditation={setMeditation}
              meditationMinutes={meditationMinutes}
              setMeditationMinutes={setMeditationMinutes}
              meals={meals}
              setMeals={setMeals}
              notes={notes}
              setNotes={setNotes}
            />
          </div>

          {/* Right Column: AI Companion */}
          <div className={`lg:col-span-4 space-y-6 transition-all duration-500 ${entranceStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <CheckInCompanion
              currentStep={currentStep}
              mood={mood}
              stress={stress}
              anxiety={anxiety}
              submitting={submitting}
            />
          </div>

        </div>
      </div>

      {/* Completion Modal Sequence */}
      {showSuccess && summaryData && (
        <CompletionScreen
          score={summaryData.score}
          aiSummary={summaryData.ai_summary}
          motivation={summaryData.motivation}
          dailyGoal={summaryData.daily_goal}
          emotion={mood}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </ProtectedRoute>
  );
}
