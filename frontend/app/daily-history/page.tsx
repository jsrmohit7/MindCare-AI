"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { 
  ArrowLeft,
  Sparkles,
  Calendar,
  X,
  Download
} from "lucide-react";
import Link from "next/link";
import { dailyWellnessService, DailyCheckInRecord } from "@/services/dailyWellness";

const MOOD_EMOJI: Record<string, string> = {
  "Very Happy": "😊",
  "Happy": "🙂",
  "Neutral": "😐",
  "Sad": "😞",
  "Very Sad": "😢",
};

export default function DailyHistoryPage() {
  const [history, setHistory] = useState<DailyCheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<DailyCheckInRecord | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await dailyWellnessService.getHistory();
      setHistory(data.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (e) {
      console.error("Failed to fetch check-in history:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const blob = await dailyWellnessService.downloadMonthlyReportPdf();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `MindCare_Monthly_Report_${new Date().toISOString().slice(0, 7)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to export PDF report:", e);
      alert("Error exporting PDF report. Please verify check-in logs exist.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center space-y-3">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto" />
            <p className="text-slate-500 text-xs font-semibold">Loading history logs...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto space-y-8 py-6">
        {/* Navigation header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>

          {history.length > 0 && (
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="inline-flex items-center space-x-2 rounded-2xl bg-white/[0.02] border border-white/[0.04] px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/[0.04] hover:text-white transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-indigo-500/5 focus:outline-none"
            >
              <Download className="h-4 w-4" />
              <span>{exporting ? "Generating PDF..." : "Export Monthly PDF"}</span>
            </button>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
            📋 Wellness Check-In History
          </h1>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
            Review your previously compiled daily trackers, check-in records, and AI-generated wellness progress recommendations.
          </p>
        </div>

        {history.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.04] bg-slate-900/20 p-12 text-center space-y-4 backdrop-blur-xl">
            <Calendar className="h-12 w-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <p className="font-bold text-slate-300 text-sm">No records found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                You haven&apos;t completed any daily wellness check-ins yet. Click below to save your first log!
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/daily-checkin"
                className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/10 active:scale-95"
              >
                Complete Daily Check-In
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((record) => (
              <div
                key={record._id}
                className="rounded-3xl border border-white/[0.05] bg-slate-900/40 p-5 flex flex-col justify-between space-y-4 hover:border-white/10 hover:bg-slate-900/60 transition-all duration-300 shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                    <span className="text-xs text-slate-400 font-bold flex items-center space-x-1.5">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{record.date}</span>
                    </span>
                    <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[9px] font-bold text-indigo-300 border border-indigo-500/20">
                      {record.wellness_score} pts
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="bg-white/[0.02] border border-white/[0.04] px-3 py-2 rounded-xl flex flex-col justify-center">
                      <span className="text-[9px] text-slate-500 font-semibold uppercase block tracking-wider">Mood</span>
                      <span className="font-bold text-slate-200 mt-0.5 flex items-center gap-1">
                        <span>{MOOD_EMOJI[record.mood] || "😐"}</span>
                        <span>{record.mood}</span>
                      </span>
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.04] px-3 py-2 rounded-xl flex flex-col justify-center">
                      <span className="text-[9px] text-slate-500 font-semibold uppercase block tracking-wider">Stress</span>
                      <span className="font-bold text-slate-200 mt-0.5">{record.stress}/10</span>
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.04] px-3 py-2 rounded-xl flex flex-col justify-center col-span-2">
                      <span className="text-[9px] text-slate-500 font-semibold uppercase block tracking-wider">Sleep Duration</span>
                      <span className="font-bold text-slate-200 mt-0.5 truncate">{record.sleep}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedItem(record)}
                  className="w-full rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-slate-200 py-2.5 transition-all border border-white/[0.05] focus:outline-none"
                >
                  View Full Report
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Report Details Modal Dialog */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-slate-900 p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              aria-label="Close details modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="space-y-1.5 pr-6 border-b border-white/[0.04] pb-4">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Daily Check-In: {selectedItem.date}</span>
              </span>
              <h3 className="text-lg font-extrabold text-white leading-tight">
                Wellness Report Details
              </h3>
              <div className="pt-2">
                <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/20">
                  Overall Score: {selectedItem.wellness_score}/100
                </span>
              </div>
            </div>

            {/* Inputs Details */}
            <div className="grid grid-cols-2 gap-3.5 text-xs text-slate-300">
              {[
                { label: "Mood", value: `${MOOD_EMOJI[selectedItem.mood] || ""} ${selectedItem.mood}` },
                { label: "Sleep Duration", value: selectedItem.sleep },
                { label: "Stress Level", value: `${selectedItem.stress}/10` },
                { label: "Anxiety Level", value: `${selectedItem.anxiety}/10` },
                { label: "Exercise", value: selectedItem.exercise ? `${selectedItem.exercise_minutes} mins` : "No" },
                { label: "Water Intake", value: selectedItem.water },
                { label: "Meditation", value: selectedItem.meditation ? `${selectedItem.meditation_minutes} mins` : "No" },
                { label: "Meals consistency", value: selectedItem.meals },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">{label}</span>
                  <span className="font-semibold text-slate-200 mt-1 block">{value}</span>
                </div>
              ))}
            </div>

            {/* Daily Notes if present */}
            {selectedItem.notes && (
              <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/[0.04] text-xs text-slate-400">
                <span className="font-bold text-slate-300 block mb-1">📝 Notes</span>
                <p className="leading-relaxed italic">&ldquo;{selectedItem.notes}&rdquo;</p>
              </div>
            )}

            {/* AI Insights Card */}
            {selectedItem.ai_summary && (
              <div className="rounded-2xl border border-white/[0.05] bg-indigo-950/15 p-5 space-y-3">
                <div className="flex items-center space-x-1.5 text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  <span>watsonx.ai Insights</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  &ldquo;{selectedItem.ai_summary}&rdquo;
                </p>
                {selectedItem.daily_goal && (
                  <div className="border-t border-white/[0.04] pt-3">
                    <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Tomorrow&apos;s Goal</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{selectedItem.daily_goal}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
