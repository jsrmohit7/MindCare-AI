"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ArrowLeft, Bell, BellOff, Clock, Sparkles } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState<"morning" | "afternoon" | "evening">("evening");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load configurations from local storage
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
      <div className="max-w-xl mx-auto space-y-8 py-6">
        {/* Navigation header */}
        <div className="flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            ⚙️ Reminder Settings
          </h1>
          <p className="text-slate-400 text-sm">
            Configure reminder times to receive daily mental wellness check-in prompts.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-6">
            {/* Enable/Disable Reminders switch */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {enabled ? (
                  <Bell className="h-6 w-6 text-indigo-400" />
                ) : (
                  <BellOff className="h-6 w-6 text-slate-500" />
                )}
                <div>
                  <label className="text-base font-bold text-white block">Daily Reminders</label>
                  <p className="text-xs text-slate-400">Receive check-in prompt notifications.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${
                  enabled ? "bg-indigo-600" : "bg-slate-950 border border-white/10"
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-full bg-white transition-transform duration-300 ${
                    enabled ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>

            {/* Config Timing selector */}
            {enabled && (
              <div className="space-y-3 animate-fadeIn border-t border-white/5 pt-4">
                <label className="text-sm font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
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
                      className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all duration-300 ${
                        time === windowOpt.id
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/15"
                          : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="text-xs font-bold block">{windowOpt.label}</span>
                      <span className="text-[10px] text-slate-400 font-semibold mt-1">{windowOpt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Success banner */}
          {success && (
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/20 p-4 text-sm text-emerald-400 flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>Reminder configurations updated successfully!</span>
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 px-6 font-bold tracking-wide shadow-lg transition-all active:scale-95"
          >
            Save Settings
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}
