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
      setHistory(data);
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
          <div className="text-center space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto" />
            <p className="text-slate-400 text-sm font-semibold">Loading history logs...</p>
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
            className="flex items-center space-x-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>

          {history.length > 0 && (
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="inline-flex items-center space-x-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{exporting ? "Generating PDF..." : "Export Monthly PDF"}</span>
            </button>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            📋 Wellness Check-In History
          </h1>
          <p className="text-slate-400 text-sm">
            Review your previous check-ins and AI generated progress recommendations.
          </p>
        </div>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-slate-900/10 p-12 text-center space-y-4">
            <Calendar className="h-12 w-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-300">No records found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                You haven&apos;t completed any daily wellness check-ins yet. Click below to save your first log!
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/daily-checkin"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all"
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
                className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 flex flex-col justify-between space-y-4 hover:border-white/20 hover:bg-slate-900/60 transition-all duration-300 shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs text-slate-400 font-bold flex items-center space-x-1.5">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{record.date}</span>
                    </span>
                    <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/20">
                      Score: {record.wellness_score}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="bg-white/5 px-3 py-2 rounded-xl flex flex-col justify-center">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Mood</span>
                      <span className="font-bold text-slate-200 mt-0.5">{record.mood}</span>
                    </div>
                    <div className="bg-white/5 px-3 py-2 rounded-xl flex flex-col justify-center">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Stress</span>
                      <span className="font-bold text-slate-200 mt-0.5">{record.stress}/10</span>
                    </div>
                    <div className="bg-white/5 px-3 py-2 rounded-xl flex flex-col justify-center col-span-2">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Sleep Duration</span>
                      <span className="font-bold text-slate-200 mt-0.5 truncate">{record.sleep}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedItem(record)}
                  className="w-full rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 py-2.5 transition-all duration-300"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 md:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              aria-label="Close details modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="space-y-1.5 pr-6 border-b border-white/5 pb-4">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Daily Check-In: {selectedItem.date}</span>
              </span>
              <h3 className="text-xl font-extrabold text-white leading-tight">
                Wellness Report Details
              </h3>
              <div className="pt-2">
                <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/20">
                  Overall Score: {selectedItem.wellness_score}/100
                </span>
              </div>
            </div>

            {/* Inputs Details Table */}
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Mood</span>
                <span className="font-semibold text-slate-200">{selectedItem.mood}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Sleep</span>
                <span className="font-semibold text-slate-200">{selectedItem.sleep}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Stress Level</span>
                <span className="font-semibold text-slate-200">{selectedItem.stress}/10</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Anxiety Level</span>
                <span className="font-semibold text-slate-200">{selectedItem.anxiety}/10</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Exercise</span>
                <span className="font-semibold text-slate-200">
                  {selectedItem.exercise ? `${selectedItem.exercise_minutes} mins` : "No"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Water Intake</span>
                <span className="font-semibold text-slate-200">{selectedItem.water}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Meditation</span>
                <span className="font-semibold text-slate-200">
                  {selectedItem.meditation ? `${selectedItem.meditation_minutes} mins` : "No"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Meals</span>
                <span className="font-semibold text-slate-200">{selectedItem.meals}</span>
              </div>
            </div>

            {/* Daily Notes if present */}
            {selectedItem.notes && (
              <div className="bg-slate-950/40 rounded-xl p-4 border border-white/5 text-xs text-slate-400">
                <span className="font-bold text-slate-300 block mb-1">📝 Notes</span>
                <p className="leading-relaxed italic">&ldquo;{selectedItem.notes}&rdquo;</p>
              </div>
            )}

            {/* AI Insights Card */}
            {selectedItem.ai_summary && (
              <div className="rounded-2xl border border-white/5 bg-indigo-950/10 p-5 space-y-3.5">
                <div className="flex items-center space-x-1.5 text-xs text-indigo-400 font-bold uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  <span>watsonx.ai Insights</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {selectedItem.ai_summary}
                </p>
                {selectedItem.daily_goal && (
                  <div className="border-t border-white/5 pt-3">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Tomorrow&apos;s Goal</div>
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
