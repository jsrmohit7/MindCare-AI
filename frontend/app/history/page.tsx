"use client";

import React, { useState, useEffect } from "react";
import { useAssessments, useDeleteAssessment } from "@/hooks/useAssessments";
import { SkeletonAssessmentCard, SkeletonWellnessCard, SkeletonLine } from "@/components/SkeletonCard";
import Button from "@/components/Button";
import Link from "next/link";
import {
  History,
  Eye,
  Trash2,
  RefreshCw,
  Calendar,
  Activity,
  Sparkles,
  Download,
  FileText,
  ClipboardList,
  ChevronRight,
  X,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { dailyWellnessService, DailyCheckInRecord } from "@/services/dailyWellness";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "assessment" | "wellness" | "reports" | "downloads";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "assessment", label: "Assessments", icon: <ClipboardList className="h-4 w-4" /> },
  { id: "wellness", label: "Daily Check-Ins", icon: <Activity className="h-4 w-4" /> },
  { id: "reports", label: "AI Insights", icon: <Sparkles className="h-4 w-4" /> },
  { id: "downloads", label: "PDF Reports", icon: <Download className="h-4 w-4" /> },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSeverityBadgeClass(severity?: string): string {
  if (!severity) return "bg-slate-500/10 border-slate-500/30 text-slate-300";
  const sev = severity.toLowerCase();
  if (sev.includes("severe") || sev.includes("high")) return "bg-rose-500/10 border-rose-500/25 text-rose-400";
  if (sev.includes("moderat")) return "bg-amber-500/10 border-amber-500/25 text-amber-400";
  return "bg-emerald-500/10 border-emerald-500/25 text-emerald-400";
}

const MOOD_EMOJI: Record<string, string> = {
  "Very Happy": "😊",
  "Happy": "🙂",
  "Neutral": "😐",
  "Sad": "😞",
  "Very Sad": "😢",
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function AssessmentTab() {
  const { data: assessments, isLoading, isError, error, refetch, isRefetching } = useAssessments(50);
  const deleteMutation = useDeleteAssessment();

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this assessment record?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <SkeletonAssessmentCard key={i} />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-500/15 bg-rose-950/10 p-6 text-center space-y-3">
        <p className="text-sm font-bold text-rose-300">Failed to load assessment history</p>
        <p className="text-xs text-rose-400">{(error as Error)?.message}</p>
        <Button variant="secondary" onClick={() => refetch()} loading={isRefetching}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!assessments || assessments.length === 0) {
    return (
      <div className="rounded-3xl border border-white/[0.04] bg-slate-900/20 p-12 text-center space-y-4 backdrop-blur-xl">
        <ClipboardList className="h-12 w-12 text-slate-600 mx-auto mb-2" aria-hidden="true" />
        <div>
          <p className="font-bold text-slate-300 text-sm">No assessments yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">Take your first mental health assessment to calibrate your clinical baseline profile.</p>
        </div>
        <Link href="/assessment" className="inline-block pt-2">
          <Button variant="primary" size="sm">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Take First Assessment
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
        <span>{assessments.length} assessment{assessments.length !== 1 ? "s" : ""} found</span>
        <button onClick={() => refetch()} disabled={isRefetching} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
          <RefreshCw className={`h-3 w-3 ${isRefetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
      <div className="space-y-4" role="list" aria-label="Assessment history">
        {assessments.map((assessment) => {
          const formattedDate = new Date(assessment.metadata.generated_at).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric",
          });
          const severity = assessment.risk_profile.overall_risk?.level ?? "Unknown";
          const score = Math.round(assessment.risk_profile.overall_risk?.score ?? 0);
          const aiPreview = assessment.ai_analysis?.recommendations?.[0] || assessment.ai_analysis?.summary || null;

          return (
            <div
              key={assessment.id}
              role="listitem"
              className="rounded-3xl border border-white/[0.05] bg-slate-900/40 p-5 flex flex-col md:flex-row md:items-start gap-5 hover:border-white/10 hover:bg-slate-900/60 transition-all duration-300 shadow-md"
            >
              {/* Icon */}
              <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 shrink-0">
                <Activity className="h-5 w-5" aria-hidden="true" />
              </div>

              {/* Info */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-200 text-sm">
                    Assessment #{assessment.id.slice(-6).toUpperCase()}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold ${getSeverityBadgeClass(severity)}`}>
                    {severity}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-bold">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                    <span>{formattedDate}</span>
                  </div>
                  <span>Score: <strong className="text-slate-300 font-bold">{score} / 100</strong></span>
                </div>
                {aiPreview && (
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 italic">
                    &ldquo;{aiPreview}&rdquo;
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Link href={`/results/${assessment.id}`}>
                  <Button variant="secondary" size="sm">
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    View Details
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl p-2"
                  onClick={() => handleDelete(assessment.id)}
                  loading={deleteMutation.isPending && deleteMutation.variables === assessment.id}
                  aria-label={`Delete assessment ${assessment.id.slice(-6).toUpperCase()}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WellnessTab() {
  const [history, setHistory] = useState<DailyCheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<DailyCheckInRecord | null>(null);

  useEffect(() => {
    dailyWellnessService.getHistory()
      .then((data) => setHistory([...data].sort((a, b) => b.date.localeCompare(a.date))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonWellnessCard key={i} />)}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-3xl border border-white/[0.04] bg-slate-900/20 p-12 text-center space-y-4 backdrop-blur-xl">
        <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-2" aria-hidden="true" />
        <div>
          <p className="font-bold text-slate-300 text-sm">No wellness check-ins yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">Save your daily check-in metrics to build consistent wellness trends.</p>
        </div>
        <Link href="/daily-checkin" className="inline-block pt-2">
          <Button variant="primary" size="sm">Complete Daily Check-In</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-4 px-1">
        <span>{history.length} check-in record{history.length !== 1 ? "s" : ""} • newest first</span>
        <Link href="/daily-history" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
          <span>Full History Grid</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Daily wellness history">
        {history.map((record) => (
          <div
            key={record._id}
            role="listitem"
            className="rounded-3xl border border-white/[0.05] bg-slate-900/40 p-5 flex flex-col justify-between space-y-4 hover:border-white/10 hover:bg-slate-900/60 transition-all duration-300 shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
                  {record.date}
                </span>
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[9px] font-bold text-indigo-300 border border-indigo-500/20">
                  {record.wellness_score} pts
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/[0.02] border border-white/[0.04] px-3 py-2 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-semibold uppercase block tracking-wider">Mood</span>
                  <span className="font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <span aria-hidden="true">{MOOD_EMOJI[record.mood] || "😐"}</span>
                    <span>{record.mood}</span>
                  </span>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] px-3 py-2 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-semibold uppercase block tracking-wider">Stress</span>
                  <span className="font-bold text-slate-200 mt-0.5">{record.stress}/10</span>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] px-3 py-2 rounded-xl col-span-2">
                  <span className="text-[9px] text-slate-500 font-semibold uppercase block tracking-wider">Sleep window</span>
                  <span className="font-bold text-slate-200 mt-0.5 truncate block">{record.sleep}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(record)}
              className="w-full rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-slate-300 py-2.5 transition-all border border-white/[0.05]"
              aria-label={`View daily report for ${record.date}`}
            >
              View Daily Report
            </button>
          </div>
        ))}
      </div>

      {/* Wellness Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={() => setSelectedItem(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Wellness report for ${selectedItem.date}`}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-slate-900 p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1 pr-8 border-b border-white/[0.04] pb-4">
              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Daily Check-In: {selectedItem.date}
              </p>
              <h3 className="text-lg font-extrabold text-white">Wellness Report Summary</h3>
              <div className="pt-2">
                <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/20">
                  Score: {selectedItem.wellness_score} / 100
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: "Mood Today", value: `${MOOD_EMOJI[selectedItem.mood] || ""} ${selectedItem.mood}` },
                { label: "Sleep window", value: selectedItem.sleep },
                { label: "Stress Level", value: `${selectedItem.stress}/10` },
                { label: "Anxiety", value: `${selectedItem.anxiety}/10` },
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

            {selectedItem.notes && (
              <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/[0.04] text-xs leading-relaxed">
                <span className="font-bold text-slate-300 block mb-1">📝 Notes</span>
                <p className="italic text-slate-400">&ldquo;{selectedItem.notes}&rdquo;</p>
              </div>
            )}

            {selectedItem.ai_summary && (
              <div className="rounded-2xl border border-white/[0.05] bg-indigo-950/10 p-5 space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" /> AI Insights (Watsonx Granite)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">&ldquo;{selectedItem.ai_summary}&rdquo;</p>
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
    </>
  );
}

function AIReportsTab() {
  const [history, setHistory] = useState<DailyCheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DailyCheckInRecord | null>(null);

  useEffect(() => {
    dailyWellnessService.getHistory()
      .then((data) => setHistory([...data].filter(r => !!r.ai_summary).sort((a, b) => b.date.localeCompare(a.date))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <SkeletonLine key={i} className="h-24 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-3xl border border-white/[0.04] bg-slate-900/20 p-12 text-center space-y-4 backdrop-blur-xl">
        <Sparkles className="h-12 w-12 text-slate-600 mx-auto mb-2" aria-hidden="true" />
        <div>
          <p className="font-bold text-slate-300 text-sm">No AI reports compiled</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">Complete daily check-ins to receive AI-generated wellness insights.</p>
        </div>
        <Link href="/daily-checkin" className="inline-block pt-2">
          <Button variant="primary" size="sm">Complete Daily Check-In</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4" role="list" aria-label="AI Reports">
        {history.map((record) => (
          <div
            key={record._id}
            role="listitem"
            className="rounded-3xl border border-white/[0.05] bg-slate-900/40 p-5 flex flex-col sm:flex-row sm:items-start gap-4 hover:border-indigo-500/20 hover:bg-slate-900/60 transition-all duration-300 shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-white">Daily AI Summary</span>
                <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  {record.date}
                </span>
                <span className="text-[9px] font-bold text-slate-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                  Score: {record.wellness_score}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 italic">
                {record.ai_summary}
              </p>
            </div>
            <button
              onClick={() => setSelected(record)}
              className="shrink-0 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-slate-200 px-4 py-2 transition-all border border-white/[0.05] focus:outline-none"
              aria-label={`Read full AI report for ${record.date}`}
            >
              Read Full Report
            </button>
          </div>
        ))}
      </div>

      {/* AI Report Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-slate-900 p-6 md:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="border-b border-white/[0.04] pb-4 pr-8">
              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">AI Daily report</p>
              <h3 className="text-lg font-extrabold text-white mt-1">{selected.date}</h3>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl bg-indigo-950/15 border border-indigo-500/10 p-5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Wellness Insight Summary
                </div>
                <p className="text-xs leading-relaxed text-slate-300">{selected.ai_summary}</p>
              </div>
              {selected.daily_goal && (
                <div className="rounded-2xl bg-emerald-950/15 border border-emerald-500/10 p-5">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">🎯 Recommended Goal</div>
                  <p className="text-xs leading-relaxed text-slate-300">{selected.daily_goal}</p>
                </div>
              )}
              {selected.motivation && (
                <div className="rounded-2xl bg-amber-950/15 border border-amber-500/10 p-5">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">✨ Daily Encouragement</div>
                  <p className="text-xs leading-relaxed text-slate-300 italic">&ldquo;{selected.motivation}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DownloadsTab() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportPdf = async () => {
    setExporting(true);
    setError(null);
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
    } catch {
      setError("Failed to generate PDF report. Please ensure you have check-in records for this month.");
    } finally {
      setExporting(false);
    }
  };

  const currentMonth = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" });

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">Download your monthly wellness reports as PDF documents for your personal files.</p>

      <div className="rounded-3xl border border-white/[0.05] bg-slate-900/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-400 shrink-0">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">{currentMonth} Wellness Report</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Includes check-ins, assessment summaries, and patterns</p>
            <p className="text-[9px] text-slate-500 mt-1 font-semibold">Generated on demand · PDF document</p>
          </div>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 px-4 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-indigo-500/10 focus:outline-none"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          <span>{exporting ? "Generating..." : "Download PDF"}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/15 bg-rose-500/10 p-4 text-xs text-rose-300">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-4 text-xs text-slate-500 space-y-1">
        <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">ℹ️ About PDF Exports</p>
        <p className="leading-relaxed">Monthly PDF summaries compile all daily metrics, Watsonx AI reports, and PHQ-9/GAD-7 indicators for clinical discussions or personal storage. Requires at least one active log.</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function HistoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("assessment");

  return (
    <div className="space-y-6 py-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <History className="h-6 w-6 text-indigo-400" aria-hidden="true" />
            History Log center
          </h1>
          <p className="text-xs text-slate-400">
            Review previous assessments, wellness check-ins, AI recommendations, and export report archives.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/assessment">
            <Button variant="primary" size="sm">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              New Assessment
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-1 bg-white/[0.02] p-1.5 rounded-2xl border border-white/[0.04] no-scrollbar" role="tablist" aria-label="History sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex-1 justify-center
              focus:outline-none
              ${activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:bg-white/[0.02] hover:text-white"
              }
            `}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-label={TABS.find(t => t.id === activeTab)?.label}
        className="pt-2 animate-fadeIn"
      >
        {activeTab === "assessment" && <AssessmentTab />}
        {activeTab === "wellness" && <WellnessTab />}
        {activeTab === "reports" && <AIReportsTab />}
        {activeTab === "downloads" && <DownloadsTab />}
      </div>
    </div>
  );
}

export default function ProtectedHistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryPage />
    </ProtectedRoute>
  );
}
