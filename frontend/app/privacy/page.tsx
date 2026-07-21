"use client";

import React, { useState, useEffect } from "react";
import { privacyAdminService, PrivacySummary } from "@/services/privacyAdmin";
import { ShieldCheck, Download, Trash2, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PrivacyPage() {
  const { logout } = useAuth();
  const [summary, setSummary] = useState<PrivacySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPrivacySummary();
  }, []);

  const loadPrivacySummary = async () => {
    try {
      const data = await privacyAdminService.getPrivacySummary();
      setSummary(data);
    } catch (err) {
      console.error("Failed to load privacy details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurge = async (category: string, label: string) => {
    if (!confirm(`Are you sure you want to permanently delete all your ${label}? This action is irreversible.`)) return;
    setPurging(category);
    setMessage("");
    try {
      await privacyAdminService.purgeCategory(category);
      setMessage(`Successfully purged all your ${label}.`);
      await loadPrivacySummary();
    } catch (err) {
      console.error("Failed to purge:", err);
    } finally {
      setPurging(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setMessage("");
    try {
      const data = await privacyAdminService.exportData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", "mindcare_personal_wellness_export.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setMessage("Your personal data archive has been compiled and downloaded successfully.");
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("WARNING: You are about to permanently delete your account and all associated logs. This action CANNOT be undone. Proceed?")) return;
    try {
      await privacyAdminService.deleteAccount();
      alert("Account and data successfully deleted. You will be signed out.");
      logout();
    } catch (err) {
      console.error("Account delete failed:", err);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-indigo-400 shrink-0" />
            GDPR Privacy Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review the information MindCare AI holds about you, download your records, or purge categories.
          </p>
        </header>

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-2 text-emerald-400 text-xs">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Data Portability / Export */}
          <section className="md:col-span-6 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4 text-left">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-200">
              <Download className="h-5 w-5 text-indigo-400" />
              Data Portability
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export all your daily check-ins, assessment history, journal entries, and conversations with the AI Coach in JSON format.
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs p-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Compiling Export..." : "Download JSON Archive"}
            </button>
          </section>

          {/* Delete Account */}
          <section className="md:col-span-6 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4 text-left">
            <h2 className="text-lg font-bold flex items-center gap-2 text-rose-400">
              <Trash2 className="h-5 w-5 text-rose-400" />
              Delete Account
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Permanently close your account and wipe all database collections (Streaks, AI Memories, and Credentials). This cannot be undone.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="w-full inline-flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 text-rose-400 hover:text-white font-bold text-xs p-3 rounded-xl transition-all"
            >
              <ShieldAlert className="h-4 w-4" />
              Delete Account & Clear Records
            </button>
          </section>

          {/* Selective Content Purges */}
          <section className="md:col-span-12 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-6 text-left">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-200">
              <Trash2 className="h-5 w-5 text-indigo-400" />
              Selective Data Purges
            </h2>
            
            {loading ? (
              <div className="text-slate-500 text-xs text-center py-6">Calculating data counts...</div>
            ) : !summary ? (
              <div className="text-slate-500 text-xs text-center py-6">Failed to load data metrics.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Mood Journals", category: "journals", count: summary.journals },
                  { label: "Wellness Goals", category: "goals", count: summary.goals },
                  { label: "Coach Threads", category: "coach", count: summary.coach_conversations },
                  { label: "Assessments", category: "assessments", count: summary.assessments },
                  { label: "Daily Check-Ins", category: "checkins", count: summary.daily_checkins },
                  { label: "AI Cognitive Profile", category: "memory", count: 1 },
                ].map((item) => (
                  <div key={item.category} className="bg-slate-950/40 border border-white/5 p-4 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-200 text-xs block">{item.label}</span>
                      <span className="text-[10px] text-slate-500">Stored: {item.count} items</span>
                    </div>
                    <button
                      onClick={() => handlePurge(item.category, item.label)}
                      disabled={purging === item.category}
                      className="p-2 bg-red-500/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white rounded-lg transition-all"
                      title={`Purge ${item.label}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] p-4 rounded-xl flex items-start gap-2.5 italic">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-400" />
              <span>
                GDPR Warning: Purging a data category will completely remove all references to those logs. Your Unified Wellness Score and AI Coach recommendations will be recalculated based on your remaining profiles.
              </span>
            </div>

          </section>

        </div>

      </div>
    </main>
  );
}
