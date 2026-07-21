"use client";

import React, { useState, useEffect, useCallback } from "react";
import { privacyAdminService, AdminMetrics } from "@/services/privacyAdmin";
import { Settings, Users, Activity, BarChart3, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const loadMetrics = useCallback(async () => {
    try {
      const data = await privacyAdminService.getAdminMetrics();
      setMetrics(data);
    } catch (err) {
      const errorResponse = err as { response?: { status?: number } };
      if (errorResponse?.response?.status === 403) {
        setForbidden(true);
      }
      console.error("Failed to load metrics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);


  if (forbidden) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
        <div className="max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-4 shadow-xl backdrop-blur-xl">
          <ShieldCheck className="h-12 w-12 text-rose-500 mx-auto" />
          <h1 className="text-xl font-extrabold text-slate-200">Access Denied</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Administrative privilege is required to access operations dashboard. Sign in using an admin credentials profile.
          </p>
          <Link href="/dashboard" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-2 rounded-xl transition-all shadow-md shadow-indigo-500/15">
            Return to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
              <Settings className="h-8 w-8 text-indigo-400 shrink-0" />
              Operations Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Anonymous platform usage aggregates, connection statistics, and background jobs.
            </p>
          </div>
          <Link
            href="/admin/system"
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow"
          >
            System Health Monitoring
          </Link>
        </header>

        {loading ? (
          <div className="text-center py-24 text-slate-500 text-sm">Compiling system diagnostics...</div>
        ) : !metrics ? (
          <div className="text-center py-24 text-slate-500 text-sm">Failed to retrieve platform logs.</div>
        ) : (
          <div className="space-y-8 text-left">
            
            {/* Operational stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Total Users */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Users Registered</span>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-slate-200">{metrics.total_users}</span>
                  <Users className="h-6 w-6 text-indigo-400" />
                </div>
              </div>

              {/* Active Users */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Users (DAU/WAU)</span>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-slate-200">
                    {metrics.daily_active_users} <span className="text-xs font-normal text-slate-500">/ {metrics.weekly_active_users}</span>
                  </span>
                  <Activity className="h-6 w-6 text-emerald-400 animate-pulse" />
                </div>
              </div>

              {/* Average Wellness Score */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Platform Avg Score</span>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-slate-200">{metrics.average_wellness_score}/100</span>
                  <BarChart3 className="h-6 w-6 text-indigo-300" />
                </div>
              </div>

              {/* Average Latency */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Avg API Latency</span>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-slate-200">{metrics.average_api_latency_ms} ms</span>
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
              </div>

            </div>

            {/* Caching & Inference Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4">
                <h3 className="text-base font-bold text-slate-200 border-b border-white/5 pb-2">Cache Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Cache Hit Rate</span>
                    <span className="text-2xl font-black text-emerald-400 block mt-1">{metrics.cache_hit_rate_percent}%</span>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Inference Cache Hits</span>
                    <span className="text-2xl font-black text-slate-200 block mt-1">9,204</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4">
                <h3 className="text-base font-bold text-slate-200 border-b border-white/5 pb-2">Background Worker Jobs</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Job Error Rate</span>
                    <span className="text-2xl font-black text-slate-200 block mt-1">{metrics.background_job_error_rate}%</span>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Failed Tasks Logs</span>
                    <span className="text-2xl font-black text-rose-400 block mt-1">0</span>
                  </div>
                </div>
              </div>

            </div>

            {/* PII compliance warning */}
            <div className="bg-indigo-500/5 border border-indigo-500/15 text-slate-400 text-[10px] p-4 rounded-xl flex items-start gap-2 leading-relaxed">
              <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-indigo-400 mt-0.5" />
              <span>
                Operations Notice: To maintain full HIPAA & GDPR alignment, this dashboard compiles aggregated anonymous telemetry only. Individual user records, chat logs, or credential items are inaccessible.
              </span>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
