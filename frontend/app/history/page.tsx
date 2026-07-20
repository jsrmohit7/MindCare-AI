"use client";

import { useAssessments, useDeleteAssessment } from "@/hooks/useAssessments";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Link from "next/link";
import { History, Eye, Trash2, RefreshCw, Calendar, Activity, Sparkles } from "lucide-react";

export default function HistoryPage() {
  const { data: assessments, isLoading, isError, error, refetch, isRefetching } = useAssessments(30);
  const deleteMutation = useDeleteAssessment();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this assessment record?")) {
      deleteMutation.mutate(id);
    }
  };

  const getSeverityBadgeClass = (severity?: string): string => {
    if (!severity) return "bg-slate-500/10 border-slate-500/30 text-slate-300";
    const sev = severity.toLowerCase();
    if (sev.includes("severe") || sev.includes("high")) {
      return "bg-rose-500/10 border-rose-500/30 text-rose-300";
    }
    if (sev.includes("moderat")) {
      return "bg-amber-500/10 border-amber-500/30 text-amber-300";
    }
    return "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner message="Retrieving assessment history logs..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <ErrorState
          title="History Loading Failed"
          message={error.message || "An error occurred while communicating with the database."}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
            <History className="h-8 w-8 text-indigo-400" />
            <span>Assessment History</span>
          </h1>
          <p className="text-sm text-slate-400">
            Review and manage all your completed clinical and AI evaluations.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={() => refetch()} isLoading={isRefetching}>
            <RefreshCw className="mr-2 h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Link href="/assessment">
            <Button variant="primary">
              <Sparkles className="mr-2 h-4 w-4" />
              <span>New Assessment</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* History Grid */}
      {!assessments || assessments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {assessments.map((assessment) => {
            const formattedDate = new Date(assessment.metadata.generated_at).toLocaleString();
            return (
              <Card key={assessment.id} hoverEffect className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  {/* Left Icon Badge */}
                  <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                    <Activity className="h-6 w-6" />
                  </div>
                  
                  {/* Assessment Info */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold text-slate-200">
                        Assessment Report #{assessment.id.slice(-6).toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${getSeverityBadgeClass(assessment.risk_profile.overall_risk?.level)}`}>
                        {assessment.risk_profile.overall_risk?.level ?? "Unknown"}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formattedDate}</span>
                      </div>
                      <div>
                        <span>Score: {Math.round(assessment.risk_profile.overall_risk?.score ?? 0)} / 100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Button Panel */}
                <div className="flex items-center space-x-3 w-full md:w-auto justify-end border-t border-white/5 pt-4 md:border-t-0 md:pt-0">
                  <Link href={`/results/${assessment.id}`} className="flex-1 sm:flex-none">
                    <Button variant="secondary" className="w-full flex items-center justify-center">
                      <Eye className="mr-2 h-4 w-4" />
                      <span>View</span>
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    onClick={() => handleDelete(assessment.id)}
                    isLoading={deleteMutation.isPending && deleteMutation.variables === assessment.id}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-2">Delete</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
