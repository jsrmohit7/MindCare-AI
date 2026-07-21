"use client";

import React, { useState, useEffect, useCallback } from "react";
import { privacyAdminService, AdminMetrics } from "@/services/privacyAdmin";
import { Settings, Users, Activity, BarChart3, Clock, ShieldCheck, Heart } from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import Card from "@/components/Card";

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
      <ProtectedRoute>
        <div className="flex h-[70vh] items-center justify-center">
          <div className="max-w-md rounded-3xl border border-rose-500/10 bg-rose-950/5 p-8 text-center space-y-4 shadow-xl backdrop-blur-xl">
            <ShieldCheck className="h-12 w-12 text-rose-500 mx-auto" />
            <h1 className="text-xl font-extrabold text-white">Access Denied</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Administrative privilege is required to access operations dashboard. Sign in using an admin credentials profile.
            </p>
            <Link href="/dashboard" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-2.5 rounded-2xl transition-all shadow-md shadow-indigo-500/10 active:scale-95">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto space-y-8 py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Settings className="h-6 w-6 text-indigo-400 shrink-0" />
              Operations Dashboard
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Anonymous platform usage aggregates, connection statistics, and background jobs.
            </p>
          </div>
          <Link
            href="/admin/system"
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-md shadow-indigo-500/10 active:scale-95"
          >
            <Heart className="h-3.5 w-3.5" />
            System Health Monitoring
          </Link>
        </header>

        {loading ? (
          <div className="text-center py-24 text-slate-500 text-xs font-semibold">Compiling system diagnostics...</div>
        ) : !metrics ? (
          <div className="text-center py-24 text-slate-500 text-xs font-semibold">Failed to retrieve platform logs.</div>
        ) : (
          <div className="space-y-8 text-left animate-fadeIn">
            
            {/* Operational stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Total Users */}
              <div className="bg-slate-900/40 border border-white/[0.05] rounded-3xl p-6 shadow-md space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Users Registered</span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-200">{metrics.total_users}</span>
                  <Users className="h-5.5 w-5.5 text-indigo-400" />
                </div>
              </div>

              {/* Active Users */}
              <div className="bg-slate-900/40 border border-white/[0.05] rounded-3xl p-6 shadow-md space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Users (DAU/WAU)</span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-200">
                    {metrics.daily_active_users} <span className="text-xs font-normal text-slate-500">/ {metrics.weekly_active_users}</span>
                  </span>
                  <Activity className="h-5.5 w-5.5 text-emerald-400 animate-pulse" />
                </div>
              </div>

              {/* Average Wellness Score */}
              <div className="bg-slate-900/40 border border-white/[0.05] rounded-3xl p-6 shadow-md space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Platform Avg Score</span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-200">{metrics.average_wellness_score}/100</span>
                  <BarChart3 className="h-5.5 w-5.5 text-indigo-300" />
                </div>
              </div>

              {/* Average Latency */}
              <div className="bg-slate-900/40 border border-white/[0.05] rounded-3xl p-6 shadow-md space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Avg API Latency</span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-200">{metrics.average_api_latency_ms} ms</span>
                  <Clock className="h-5.5 w-5.5 text-purple-400" />
                </div>
              </div>

            </div>

            {/* Caching & Inference Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <Card className="space-y-4">
                <h3 className="text-sm font-bold text-slate-200 border-b border-white/[0.04] pb-2.5">Cache Statistics</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Cache Hit Rate</span>
                    <span className="text-xl font-black text-emerald-400 block mt-1">{metrics.cache_hit_rate_percent}%</span>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Inference Cache Hits</span>
                    <span className="text-xl font-black text-slate-200 block mt-1">9,204</span>
                  </div>
                </div>
              </Card>

              <Card className="space-y-4">
                <h3 className="text-sm font-bold text-slate-200 border-b border-white/[0.04] pb-2.5">Background Worker Jobs</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Job Error Rate</span>
                    <span className="text-xl font-black text-slate-200 block mt-1">{metrics.background_job_error_rate}%</span>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Failed Tasks Logs</span>
                    <span className="text-xl font-black text-rose-400 block mt-1">0</span>
                  </div>
                </div>
              </Card>

            </div>

            {/* PII compliance warning */}
            <div className="bg-indigo-500/5 border border-indigo-500/10 text-slate-400 text-[10px] p-4.5 rounded-2xl flex items-start gap-2.5 leading-relaxed italic">
              <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-indigo-400 mt-0.5" />
              <span>
                Operations Notice: To maintain full HIPAA & GDPR compliance alignment, this dashboard compiles aggregated anonymous telemetry only. Individual user records, chat logs, or credential items are inaccessible.
              </span>
            </div>

          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
