"use client";

import React, { useState, useEffect, useCallback } from "react";
import { privacyAdminService, SystemHealth } from "@/services/privacyAdmin";
import { ShieldCheck, Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import Card from "@/components/Card";

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const loadHealth = useCallback(async () => {
    try {
      const data = await privacyAdminService.getSystemHealth();
      setHealth(data);
    } catch (err) {
      const errorResponse = err as { response?: { status?: number } };
      if (errorResponse?.response?.status === 403) {
        setForbidden(true);
      }
      console.error("Failed to load health indicators:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  if (forbidden) {
    return (
      <ProtectedRoute>
        <div className="flex h-[70vh] items-center justify-center">
          <div className="max-w-md rounded-3xl border border-rose-500/10 bg-rose-950/5 p-8 text-center space-y-4 shadow-xl backdrop-blur-xl">
            <ShieldCheck className="h-12 w-12 text-rose-500 mx-auto" />
            <h1 className="text-xl font-extrabold text-white">Access Denied</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Administrative privilege is required to access system diagnostics.
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
      <div className="max-w-4xl mx-auto space-y-8 py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Back navigation */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-all text-left"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Operations Dashboard
        </Link>

        {/* Header */}
        <header className="border-b border-white/[0.04] pb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Heart className="h-6 w-6 text-rose-500 shrink-0 animate-pulse" />
            Infrastructure System Health
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            Realtime connection health, latency meters, and CPU/memory utilization telemetry.
          </p>
        </header>

        {loading ? (
          <div className="text-center py-24 text-slate-500 text-xs font-semibold">Querying system endpoints...</div>
        ) : !health ? (
          <div className="text-center py-24 text-slate-500 text-xs font-semibold">Failed to retrieve status flags.</div>
        ) : (
          <div className="space-y-8 text-left animate-fadeIn">
            
            {/* Services Status */}
            <Card className="space-y-4">
              <h2 className="text-sm font-bold text-slate-200 border-b border-white/[0.04] pb-2.5">Active Services Status</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(health.services).map(([service, status]) => (
                  <div key={service} className="bg-slate-950/40 border border-white/[0.04] p-4 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 capitalize">{service.replace("_", " ")}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold border ${
                      status === "Healthy"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Latency and System Utilization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Latencies */}
              <Card className="space-y-4">
                <h3 className="text-sm font-bold text-slate-200 border-b border-white/[0.04] pb-2.5">Connection Latencies</h3>
                <div className="space-y-3.5 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-400">REST API Gateway</span>
                    <span className="font-bold text-slate-200">{health.latencies.api_latency_ms} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">MongoDB Database Connection</span>
                    <span className="font-bold text-slate-200">{health.latencies.database_latency_ms} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Watsonx Granite Inference Connection</span>
                    <span className="font-bold text-slate-200">{health.latencies.ai_inference_latency_ms} ms</span>
                  </div>
                </div>
              </Card>

              {/* Resource Utilization */}
              <Card className="space-y-4">
                <h3 className="text-sm font-bold text-slate-200 border-b border-white/[0.04] pb-2.5">Host Resources</h3>
                <div className="space-y-3.5 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-400">System Uptime</span>
                    <span className="font-bold text-slate-200">{health.system.uptime_hours} Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">RAM Memory Usage</span>
                    <span className="font-bold text-slate-200">{health.system.memory_usage_percent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Host CPU Utilisation</span>
                    <span className="font-bold text-slate-200">{health.system.cpu_utilization_percent}%</span>
                  </div>
                </div>
              </Card>

            </div>

          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
