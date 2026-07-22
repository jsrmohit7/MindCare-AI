"use client";

import React from "react";
import { ArrowLeft, ArrowRight, Check, FileText } from "lucide-react";
import { EmotionSelector } from "./EmotionSelector";

interface QuestionCardProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  
  // State props
  mood: string;
  setMood: (v: string) => void;
  stress: number;
  setStress: (v: number) => void;
  anxiety: number;
  setAnxiety: (v: number) => void;
  sleep: string;
  setSleep: (v: string) => void;
  water: string;
  setWater: (v: string) => void;
  exercise: boolean;
  setExercise: (v: boolean) => void;
  exerciseMinutes: number;
  setExerciseMinutes: (v: number) => void;
  meditation: boolean;
  setMeditation: (v: boolean) => void;
  meditationMinutes: number;
  setMeditationMinutes: (v: number) => void;
  meals: string;
  setMeals: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
}

export function QuestionCard({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSubmit,
  submitting,
  mood,
  setMood,
  stress,
  setStress,
  anxiety,
  setAnxiety,
  sleep,
  setSleep,
  water,
  setWater,
  exercise,
  setExercise,
  exerciseMinutes,
  setExerciseMinutes,
  meditation,
  setMeditation,
  meditationMinutes,
  setMeditationMinutes,
  meals,
  setMeals,
  notes,
  setNotes,
}: QuestionCardProps) {

  const stepTitles = [
    "1. Emotion Baseline",
    "2. Stress & Anxiety Vitals",
    "3. Sleep & Hydration",
    "4. Lifestyle Habits",
    "5. Notes & Reflection",
  ];

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 sm:p-8 backdrop-blur-3xl shadow-2xl space-y-6 animate-fadeIn">
      
      {/* Step Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
            Guided Calibration
          </span>
          <h3 className="text-sm font-extrabold text-white">
            {stepTitles[currentStep - 1]}
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-400">
          Step {currentStep} of {totalSteps}
        </span>
      </div>

      {/* Step 1: Emotion Baseline */}
      {currentStep === 1 && (
        <div className="animate-fadeIn space-y-4">
          <EmotionSelector selectedEmotion={mood} onSelectEmotion={setMood} />
        </div>
      )}

      {/* Step 2: Stress & Anxiety Sliders */}
      {currentStep === 2 && (
        <div className="animate-fadeIn space-y-6">
          {/* Stress Slider */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                😟 Stress Level
              </label>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {stress} / 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={stress}
              onChange={(e) => setStress(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Minimal</span>
              <span>Moderate</span>
              <span>Extreme</span>
            </div>
          </div>

          {/* Anxiety Slider */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                😰 Anxiety Level
              </label>
              <span className="text-xs font-bold text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
                {anxiety} / 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={anxiety}
              onChange={(e) => setAnxiety(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-pink-400"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Minimal</span>
              <span>Moderate</span>
              <span>Extreme</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Sleep & Hydration */}
      {currentStep === 3 && (
        <div className="animate-fadeIn space-y-6">
          {/* Sleep Duration */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              😴 Sleep Duration
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["Less than 4 Hours", "4–6 Hours", "6–8 Hours", "More than 8 Hours"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSleep(opt)}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all text-center ${
                    sleep === opt
                      ? "bg-accent/20 border-accent/40 text-white shadow-md shadow-accent/15"
                      : "bg-slate-900/40 border-white/[0.06] text-slate-400 hover:text-white"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Hydration */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              💧 Water Intake
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["Less than 1L", "1–2L", "2–3L", "More than 3L"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setWater(opt)}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all text-center ${
                    water === opt
                      ? "bg-accent/20 border-accent/40 text-white shadow-md shadow-accent/15"
                      : "bg-slate-900/40 border-white/[0.06] text-slate-400 hover:text-white"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Exercise, Meditation, Meals */}
      {currentStep === 4 && (
        <div className="animate-fadeIn space-y-5">
          {/* Exercise Toggle */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">🏃 Physical Exercise</span>
                <span className="text-[10px] text-slate-400">Did you workout today?</span>
              </div>
              <button
                type="button"
                onClick={() => setExercise(!exercise)}
                className={`w-12 h-7 rounded-full p-1 transition-all ${
                  exercise ? "bg-accent" : "bg-slate-900 border border-white/[0.08]"
                }`}
              >
                <div className={`h-5 w-5 rounded-full bg-white transition-transform ${exercise ? "translate-x-5" : ""}`} />
              </button>
            </div>

            {exercise && (
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] animate-fadeIn">
                <label className="text-xs text-slate-300 font-medium">Minutes Exercised:</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={exerciseMinutes}
                  onChange={(e) => setExerciseMinutes(parseInt(e.target.value) || 0)}
                  className="w-24 bg-slate-900 border border-white/[0.08] rounded-xl px-3 py-1.5 text-center text-xs text-white focus:outline-none focus:border-accent/40"
                />
              </div>
            )}
          </div>

          {/* Meditation Toggle */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">🧘 Mindfulness / Meditation</span>
                <span className="text-[10px] text-slate-400">Did you practice breathing or meditation?</span>
              </div>
              <button
                type="button"
                onClick={() => setMeditation(!meditation)}
                className={`w-12 h-7 rounded-full p-1 transition-all ${
                  meditation ? "bg-accent" : "bg-slate-900 border border-white/[0.08]"
                }`}
              >
                <div className={`h-5 w-5 rounded-full bg-white transition-transform ${meditation ? "translate-x-5" : ""}`} />
              </button>
            </div>

            {meditation && (
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] animate-fadeIn">
                <label className="text-xs text-slate-300 font-medium">Minutes Meditated:</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={meditationMinutes}
                  onChange={(e) => setMeditationMinutes(parseInt(e.target.value) || 0)}
                  className="w-24 bg-slate-900 border border-white/[0.08] rounded-xl px-3 py-1.5 text-center text-xs text-white focus:outline-none focus:border-accent/40"
                />
              </div>
            )}
          </div>

          {/* Meals Consistency */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">🍽 Meals Consistency</label>
            <div className="grid grid-cols-3 gap-2">
              {["Skipped", "Normal", "Healthy"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setMeals(opt)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    meals === opt
                      ? "bg-accent/20 border-accent/40 text-white shadow-md shadow-accent/15"
                      : "bg-slate-900/40 border-white/[0.06] text-slate-400 hover:text-white"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Notes & Reflection */}
      {currentStep === 5 && (
        <div className="animate-fadeIn space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <FileText className="h-4 w-4 text-accent" />
                <span>Personal Reflections (Optional)</span>
              </label>
              <span className={`text-[10px] font-bold ${notes.length > 450 ? "text-rose-400" : "text-slate-500"}`}>
                {notes.length} / 500
              </span>
            </div>
            <textarea
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reflect on key wins, stressors, or gratitude for today..."
              rows={5}
              className="w-full rounded-2xl border border-white/[0.08] bg-slate-900/60 p-4 text-xs text-white placeholder-slate-500 focus:border-accent/40 focus:outline-none transition-all leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* Navigation & Submit Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={onPrev}
            className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 text-xs font-bold flex items-center gap-2 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : <span />}

        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={onNext}
            className="ml-auto p-3.5 px-6 rounded-2xl bg-accent hover:bg-accent/90 border border-accent/40 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-accent/20 active:scale-95"
          >
            <span>Continue</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="ml-auto p-3.5 px-6 rounded-2xl bg-accent hover:bg-accent/90 border border-accent/40 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-accent/20 active:scale-95 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>{submitting ? "Calibrating..." : "Complete Check-In"}</span>
          </button>
        )}
      </div>

    </div>
  );
}
