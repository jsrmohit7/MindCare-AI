"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ArrowLeft, Bell, BellOff, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import Card from "@/components/Card";
import { useEmotion } from "@/context/EmotionContext";

export default function SettingsPage() {
  const { overrideTheme, setManualThemeOverride } = useEmotion();
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState<"morning" | "afternoon" | "evening">("evening");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEnabled = localStorage.getItem("reminders_enabled") === "true";
      const savedTime = (localStorage.getItem("reminders_time") as "morning" | "afternoon" | "evening") || "evening";
      setEnabled(savedEnabled);
      setTime(savedTime);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("reminders_enabled", String(enabled));
      localStorage.setItem("reminders_time", time);
    }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <ProtectedRoute>
      <div className="max-w-xl mx-auto space-y-8 py-6 px-4 sm:px-6 lg:px-8">
        {/* Navigation header */}
        <div className="flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
            ⚙️ Reminder Settings
          </h1>
          <p className="text-slate-400 text-xs leading-relaxed max-w-md">
            Configure reminder times to receive daily mental wellness check-in prompts and notification cues.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card className="space-y-6">
            {/* Enable/Disable Reminders switch */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                {enabled ? (
                  <Bell className="h-5.5 w-5.5 text-indigo-400" />
                ) : (
                  <BellOff className="h-5.5 w-5.5 text-slate-500" />
                )}
                <div>
                  <label className="text-sm font-bold text-white block">Daily Reminders</label>
                  <p className="text-xs text-slate-400 mt-0.5">Receive prompt alerts in your chosen window.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className={`w-14 h-8 rounded-full p-1 transition-all duration-200 ${
                  enabled ? "bg-indigo-600" : "bg-slate-950 border border-white/[0.08]"
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-full bg-white transition-transform duration-200 ${
                    enabled ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>

            {/* Config Timing selector */}
            {enabled && (
              <div className="space-y-3 animate-fadeIn border-t border-white/[0.04] pt-4">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 uppercase tracking-wider">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span>Select Time Window:</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "morning", label: "🌅 Morning", desc: "8:00 AM" },
                    { id: "afternoon", label: "☀️ Afternoon", desc: "2:00 PM" },
                    { id: "evening", label: "🌌 Evening", desc: "8:00 PM" }
                  ].map((windowOpt) => (
                    <button
                      key={windowOpt.id}
                      type="button"
                      onClick={() => setTime(windowOpt.id as "morning" | "afternoon" | "evening")}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all duration-200 ${
                        time === windowOpt.id
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/15"
                          : "bg-white/[0.01] border-white/[0.04] text-slate-400 hover:text-slate-200 hover:border-white/10"
                      }`}
                    >
                      <span className="text-xs font-bold block">{windowOpt.label}</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-1">{windowOpt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center space-x-3.5 border-b border-white/[0.04] pb-4 mb-2">
              <Sparkles className="h-5.5 w-5.5 text-indigo-400" />
              <div>
                <label className="text-sm font-bold text-white block">Theme Engine Preference</label>
                <p className="text-xs text-slate-400 mt-0.5">Adapt application mood accents automatically or lock one manually.</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Active Theme Mode</label>
              <select
                value={overrideTheme === null ? "auto" : overrideTheme}
                onChange={(e) => {
                  const val = e.target.value;
                  setManualThemeOverride(val === "auto" ? null : val);
                }}
                className="block w-full rounded-2xl border border-white/[0.08] bg-slate-950 px-4 py-3.5 text-xs text-white focus:border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="auto">✨ Emotion-Adaptive Mode (Auto)</option>
                <option value="happy">😊 Happy Accent</option>
                <option value="calm">😌 Calm Accent</option>
                <option value="focused">🎯 Focused Accent</option>
                <option value="stressed">😟 Stressed Accent</option>
                <option value="anxious">😰 Anxious Accent</option>
                <option value="low_mood">😔 Low Mood Accent</option>
              </select>
            </div>
          </Card>

          {/* Success banner */}
          {success && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-400 flex items-center space-x-2">
              <Sparkles className="h-4.5 w-4.5" />
              <span>Reminder configurations updated successfully!</span>
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 text-white py-3.5 px-6 font-bold tracking-wide shadow-lg shadow-indigo-500/10 transition-all active:scale-[0.98] focus:outline-none"
          >
            Save Settings
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}
