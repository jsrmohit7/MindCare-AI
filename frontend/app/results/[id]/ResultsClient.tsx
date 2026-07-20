"use client";

import { useAssessment } from "@/hooks/useAssessments";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorState from "@/components/ErrorState";
import Card from "@/components/Card";
import Link from "next/link";
import { 
  BrainCircuit, 
  CheckCircle2, 
  Heart, 
  ShieldAlert, 
  Clock, 
  Database, 
  AlertTriangle, 
  ArrowLeft,
  Moon,
  Leaf,
  Zap
} from "lucide-react";

interface ResultsClientProps {
  id: string;
}

export default function ResultsClient({ id }: ResultsClientProps) {
  const { data: assessment, isLoading, isError, error, refetch } = useAssessment(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoadingSpinner message="Retrieving assessment records. Formulating clinical scoring aggregates and Watsonx AI insights..." />
      </div>
    );
  }

  if (isError || !assessment) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <ErrorState
          title="Unable to load results"
          message={error?.message || "The requested assessment ID is invalid or does not exist."}
          onRetry={refetch}
        />
      </div>
    );
  }

  const { risk_profile, ai_analysis, metadata } = assessment;

  // Defensive helper: safely color-codes severity / risk level strings
  const getSeverityBadgeClass = (value?: string): string => {
    if (!value) return "bg-slate-500/10 border-slate-500/30 text-slate-300";
    const v = value.toLowerCase();
    if (v.includes("severe") || v.includes("high")) {
      return "bg-rose-500/10 border-rose-500/30 text-rose-300";
    }
    if (v.includes("moderat")) {
      return "bg-amber-500/10 border-amber-500/30 text-amber-300";
    }
    return "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
  };

  // Defensive helper: returns the correct Tailwind gradient for a risk level string
  const getOverallRiskGradient = (level?: string): string => {
    if (!level) return "from-slate-500 via-slate-400 to-slate-500";
    const lvl = level.toLowerCase();
    if (lvl.includes("severe") || lvl.includes("high")) {
      return "from-rose-500 via-pink-500 to-red-500";
    }
    if (lvl.includes("moderat")) {
      return "from-amber-500 via-yellow-500 to-orange-500";
    }
    return "from-emerald-400 via-teal-500 to-indigo-500";
  };

  // Clamps the score to [0, 100] for the progress bar width
  const clampScore = (score: number): number => Math.min(100, Math.max(0, score));

  const overallLevel = risk_profile.overall_risk?.level ?? "Unknown";
  const overallScore = risk_profile.overall_risk?.score ?? 0;

  return (
    <div className="space-y-8 py-6">
      {/* Back Button */}
      <Link href="/history" className="inline-flex items-center text-sm font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        <span>Back to Assessment History</span>
      </Link>

      {/* Hero Overview */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-30 blur-2xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Mental Health Assessment Report</h1>
            <p className="text-sm text-slate-400">Generated on {new Date(metadata.generated_at).toLocaleString()}</p>
          </div>
          <div className="flex flex-col items-start md:items-end space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Risk Level</span>
            <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-base font-extrabold ${getSeverityBadgeClass(overallLevel)}`}>
              {overallLevel}
            </span>
          </div>
        </div>

        {/* Wellness Severity Gauge */}
        <div className="mt-8 space-y-2">
          <div className="flex justify-between text-sm font-bold text-slate-300">
            <span>Wellness Severity Meter</span>
            <span>{Math.round(overallScore)} / 100</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden border border-white/5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getOverallRiskGradient(overallLevel)} transition-all duration-1000 ease-out`}
              style={{ width: `${clampScore(overallScore)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Clinical & Lifestyle Scores */}
        <div className="lg:col-span-1 space-y-8">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-200">Clinical Severity Breakdown</h2>

          {/* PHQ-9 Card */}
          <Card hoverEffect className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Heart className="h-5 w-5" />
                <h3 className="font-bold text-slate-100">Depression (PHQ-9)</h3>
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${getSeverityBadgeClass(risk_profile.phq9?.severity)}`}>
                {risk_profile.phq9?.severity}
              </span>
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-white">{risk_profile.phq9?.score}</span>
              <span className="text-sm text-slate-500">/ 27</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Measures depressive symptom severity. Scores of 10+ suggest moderate to severe symptoms that warrant clinical review.
            </p>
          </Card>

          {/* GAD-7 Card */}
          <Card hoverEffect className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-400">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="font-bold text-slate-100">Anxiety (GAD-7)</h3>
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${getSeverityBadgeClass(risk_profile.gad7?.severity)}`}>
                {risk_profile.gad7?.severity}
              </span>
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-white">{risk_profile.gad7?.score}</span>
              <span className="text-sm text-slate-500">/ 21</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Evaluates generalized anxiety symptoms. Scores of 10+ suggest moderate to severe anxiety levels.
            </p>
          </Card>

          {/* Lifestyle Indicators */}
          <h2 className="text-xl font-extrabold tracking-tight text-slate-200 pt-4">Lifestyle Indicators</h2>

          {/* Stress Card */}
          <Card hoverEffect className="space-y-3 text-sm">
            <div className="flex items-center space-x-2 text-amber-400 pb-2 border-b border-white/5">
              <Zap className="h-4 w-4" />
              <span className="font-bold text-slate-100">Stress</span>
              <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-xs font-bold ${getSeverityBadgeClass(risk_profile.stress?.severity)}`}>
                {risk_profile.stress?.severity}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Stress Score</span>
              <span className="font-bold text-slate-200">{risk_profile.stress?.score}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Overall score reflecting reported stress level frequency and emotional pressure.
            </p>
          </Card>

          {/* Sleep Card */}
          <Card hoverEffect className="space-y-3 text-sm">
            <div className="flex items-center space-x-2 text-blue-400 pb-2 border-b border-white/5">
              <Moon className="h-4 w-4" />
              <span className="font-bold text-slate-100">Sleep</span>
              <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-xs font-bold ${getSeverityBadgeClass(risk_profile.sleep?.severity)}`}>
                {risk_profile.sleep?.severity}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Sleep Score</span>
              <span className="font-bold text-slate-200">{risk_profile.sleep?.score}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Overall score reflecting sleep duration, night awakenings, latency, and subjective quality.
            </p>
          </Card>

          {/* Lifestyle Card */}
          <Card hoverEffect className="space-y-3 text-sm">
            <div className="flex items-center space-x-2 text-emerald-400 pb-2 border-b border-white/5">
              <Leaf className="h-4 w-4" />
              <span className="font-bold text-slate-100">Lifestyle</span>
              <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-xs font-bold ${getSeverityBadgeClass(risk_profile.lifestyle?.severity)}`}>
                {risk_profile.lifestyle?.severity}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Lifestyle Score</span>
              <span className="font-bold text-slate-200">{risk_profile.lifestyle?.score}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Overall score reflecting physical exercise, diet, hydration, screen time, and substance use habits.
            </p>
          </Card>
        </div>

        {/* Right Column: AI Analysis & Recommendations */}
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-200 flex items-center space-x-2">
            <BrainCircuit className="h-6 w-6 text-purple-400" />
            <span>Watsonx AI Clinical Insight</span>
          </h2>

          {/* Summary */}
          <Card className="space-y-4">
            <h3 className="font-extrabold text-indigo-300">Executive Summary</h3>
            <p className="text-sm leading-relaxed text-slate-300">{ai_analysis.summary}</p>
          </Card>

          {/* Detailed Risk Assessment */}
          <Card className="space-y-4">
            <h3 className="font-extrabold text-indigo-300">Detailed Risk Assessment</h3>
            <p className="text-sm leading-relaxed text-slate-300">{ai_analysis.risk_assessment}</p>
          </Card>

          {/* Recommendations list */}
          <Card className="space-y-4">
            <h3 className="font-extrabold text-indigo-300">Actionable Recommendations</h3>
            <ul className="space-y-3">
              {ai_analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start text-sm leading-relaxed text-slate-300 bg-white/5 rounded-xl p-3 border border-white/5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 mr-3 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Follow Up */}
          <Card className="space-y-4">
            <h3 className="font-extrabold text-indigo-300">Follow-up Protocols</h3>
            <p className="text-sm leading-relaxed text-slate-300">{ai_analysis.follow_up}</p>
          </Card>

          {/* Disclaimer & Metadata */}
          <div className="space-y-4">
            {/* Disclaimer */}
            <div className="flex items-start rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 text-xs text-amber-300 leading-relaxed">
              <AlertTriangle className="h-5 w-5 mr-3 shrink-0 text-amber-400" />
              <span>{ai_analysis.disclaimer}</span>
            </div>

            {/* Pipeline Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/5 bg-slate-900/10 p-4 text-[10px] sm:text-xs text-slate-500">
              <div className="flex items-center space-x-1.5">
                <BrainCircuit className="h-4 w-4" />
                <span>Model: {metadata.model}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Database className="h-4 w-4" />
                <span>Schema Version: {metadata.schema_version}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Clock className="h-4 w-4" />
                <span>Response Validated</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
