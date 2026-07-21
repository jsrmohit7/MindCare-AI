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
  { id: "assessment", label: "Assessment History", icon: <ClipboardList className="h-4 w-4" /> },
  { id: "wellness", label: "Daily Wellness", icon: <Activity className="h-4 w-4" /> },
  { id: "reports", label: "AI Reports", icon: <Sparkles className="h-4 w-4" /> },
  { id: "downloads", label: "Downloads", icon: <Download className="h-4 w-4" /> },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSeverityBadgeClass(severity?: string): string {
  if (!severity) return "bg-slate-500/10 border-slate-500/30 text-slate-300";
  const sev = severity.toLowerCase();
  if (sev.includes("severe") || sev.includes("high")) return "bg-rose-500/10 border-rose-500/30 text-rose-300";
  if (sev.includes("moderat")) return "bg-amber-500/10 border-amber-500/30 text-amber-300";
  return "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
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
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center space-y-3">
        <p className="text-sm font-bold text-rose-300">Failed to load assessment history</p>
        <p className="text-xs text-rose-400">{(error as Error)?.message}</p>
        <Button variant="secondary" onClick={() => refetch()} isLoading={isRefetching}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!assessments || assessments.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-12 text-center space-y-4">
        <ClipboardList className="h-12 w-12 text-slate-600 mx-auto" aria-hidden="true" />
        <div>
          <p className="font-semibold text-slate-300">No assessments yet</p>
          <p className="text-xs text-slate-500 mt-1">Take your first mental health assessment to get started.</p>
        </div>
        <Link href="/assessment">
          <Button variant="primary">
            <Sparkles className="mr-2 h-4 w-4" />
            Take First Assessment
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{assessments.length} assessment{assessments.length !== 1 ? "s" : ""} found</span>
        <Button variant="secondary" onClick={() => refetch()} isLoading={isRefetching} className="text-xs py-1.5 px-3">
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Refresh
        </Button>
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
              className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 flex flex-col md:flex-row md:items-start gap-5 hover:border-white/20 hover:bg-slate-900/60 transition-all duration-200 shadow-lg"
            >
              {/* Icon */}
              <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 shrink-0">
                <Activity className="h-6 w-6" aria-hidden="true" />
              </div>

              {/* Info */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-200 text-sm">
                    Assessment #{assessment.id.slice(-6).toUpperCase()}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${getSeverityBadgeClass(severity)}`}>
                    {severity}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{formattedDate}</span>
                  </div>
                  <span>Score: <strong className="text-slate-200">{score} / 100</strong></span>
                </div>
                {aiPreview && (
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 italic">
                    &ldquo;{aiPreview}&rdquo;
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/results/${assessment.id}`}>
                  <Button variant="secondary" className="text-xs py-1.5 px-3">
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    View Details
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs py-1.5 px-2"
                  onClick={() => handleDelete(assessment.id)}
                  isLoading={deleteMutation.isPending && deleteMutation.variables === assessment.id}
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
      <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-12 text-center space-y-4">
        <Calendar className="h-12 w-12 text-slate-600 mx-auto" aria-hidden="true" />
        <div>
          <p className="font-semibold text-slate-300">No daily wellness records yet</p>
          <p className="text-xs text-slate-500 mt-1">Complete your first daily check-in to start tracking your wellness journey.</p>
        </div>
        <Link href="/daily-checkin">
          <Button variant="primary">Complete Daily Check-In</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
        <span>{history.length} check-in record{history.length !== 1 ? "s" : ""} • newest first</span>
        <Link href="/daily-history" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
          Full History
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Daily wellness history">
        {history.map((record) => (
          <div
            key={record._id}
            role="listitem"
            className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 flex flex-col justify-between space-y-4 hover:border-white/20 hover:bg-slate-900/60 transition-all duration-200 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
                  {record.date}
                </span>
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/20">
                  {record.wellness_score}pts
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/5 px-3 py-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Mood</span>
                  <span className="font-bold text-slate-200 mt-0.5 flex items-center gap-1">
                    <span aria-hidden="true">{MOOD_EMOJI[record.mood] || "🙂"}</span>
                    {record.mood}
                  </span>
                </div>
                <div className="bg-white/5 px-3 py-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Stress</span>
                  <span className="font-bold text-slate-200 mt-0.5">{record.stress}/10</span>
                </div>
                <div className="bg-white/5 px-3 py-2 rounded-xl col-span-2">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Sleep</span>
                  <span className="font-bold text-slate-200 mt-0.5 truncate block">{record.sleep}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(record)}
              className="w-full rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 py-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Wellness report for ${selectedItem.date}`}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1.5 pr-8 border-b border-white/5 pb-4">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                Daily Check-In: {selectedItem.date}
              </p>
              <h3 className="text-xl font-extrabold text-white">Wellness Report</h3>
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/20">
                Score: {selectedItem.wellness_score}/100
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Mood", value: `${MOOD_EMOJI[selectedItem.mood] || ""} ${selectedItem.mood}` },
                { label: "Sleep", value: selectedItem.sleep },
                { label: "Stress", value: `${selectedItem.stress}/10` },
                { label: "Anxiety", value: `${selectedItem.anxiety}/10` },
                { label: "Exercise", value: selectedItem.exercise ? `${selectedItem.exercise_minutes} mins` : "No" },
                { label: "Water", value: selectedItem.water },
                { label: "Meditation", value: selectedItem.meditation ? `${selectedItem.meditation_minutes} mins` : "No" },
                { label: "Meals", value: selectedItem.meals },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/5 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">{label}</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">{value}</span>
                </div>
              ))}
            </div>

            {selectedItem.notes && (
              <div className="bg-slate-950/40 rounded-xl p-4 border border-white/5 text-xs">
                <span className="font-bold text-slate-300 block mb-1">📝 Notes</span>
                <p className="leading-relaxed italic text-slate-400">&ldquo;{selectedItem.notes}&rdquo;</p>
              </div>
            )}

            {selectedItem.ai_summary && (
              <div className="rounded-2xl border border-white/5 bg-indigo-950/10 p-5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" /> AI Insights (watsonx.ai)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedItem.ai_summary}</p>
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
        {[1, 2, 3].map((i) => <SkeletonLine key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-12 text-center space-y-4">
        <Sparkles className="h-12 w-12 text-slate-600 mx-auto" aria-hidden="true" />
        <div>
          <p className="font-semibold text-slate-300">No AI reports generated yet</p>
          <p className="text-xs text-slate-500 mt-1">Complete daily check-ins to receive AI-generated wellness insights.</p>
        </div>
        <Link href="/daily-checkin">
          <Button variant="primary">Complete Daily Check-In</Button>
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
            className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 flex flex-col sm:flex-row sm:items-start gap-4 hover:border-indigo-500/20 hover:bg-slate-900/60 transition-all duration-200 shadow-lg"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-white">Daily AI Report</span>
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  {record.date}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                  Score: {record.wellness_score}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {record.ai_summary}
              </p>
            </div>
            <button
              onClick={() => setSelected(record)}
              className="shrink-0 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 px-4 py-2 transition-all border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={`Read full AI report for ${record.date}`}
            >
              Read Full
            </button>
          </div>
        ))}
      </div>

      {/* AI Report Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="border-b border-white/5 pb-4 pr-8">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">AI Daily Report</p>
              <h3 className="text-xl font-extrabold text-white mt-1">{selected.date}</h3>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl bg-indigo-950/20 border border-indigo-500/10 p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase mb-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Wellness Insights
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{selected.ai_summary}</p>
              </div>
              {selected.daily_goal && (
                <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/10 p-4">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase mb-2">🎯 Tomorrow&apos;s Goal</div>
                  <p className="text-sm text-slate-300 leading-relaxed">{selected.daily_goal}</p>
                </div>
              )}
              {selected.motivation && (
                <div className="rounded-xl bg-amber-950/20 border border-amber-500/10 p-4">
                  <div className="text-[10px] font-bold text-amber-400 uppercase mb-2">✨ Motivation</div>
                  <p className="text-sm text-slate-300 leading-relaxed italic">&ldquo;{selected.motivation}&rdquo;</p>
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
      <p className="text-xs text-slate-400">Download your monthly wellness reports as PDF files.</p>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
            <FileText className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{currentMonth} Wellness Report</p>
            <p className="text-xs text-slate-400">Includes all daily check-ins, scores, and AI insights</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Generated on demand · PDF format</p>
          </div>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {exporting ? "Generating..." : "Download PDF"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">ℹ️ About Downloads</p>
        <p>Monthly PDF reports include your complete wellness data, AI insights, and progress analytics for the current month. Reports require at least one check-in to generate.</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function HistoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("assessment");

  return (
    <div className="space-y-6 py-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <History className="h-8 w-8 text-indigo-400" aria-hidden="true" />
            History
          </h1>
          <p className="text-sm text-slate-400">
            Review your assessments, daily wellness records, AI insights, and download reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/assessment">
            <Button variant="primary" className="text-xs">
              <Sparkles className="mr-2 h-4 w-4" />
              New Assessment
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 no-scrollbar" role="tablist" aria-label="History sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex-1 justify-center
              focus:outline-none focus:ring-2 focus:ring-indigo-500
              ${activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
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
