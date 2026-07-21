"use client";

import React, { useState, useEffect, useCallback } from "react";
import { privacyAdminService, SystemHealth } from "@/services/privacyAdmin";
import { ShieldCheck, Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
        <div className="max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-4 shadow-xl backdrop-blur-xl">
          <ShieldCheck className="h-12 w-12 text-rose-500 mx-auto" />
          <h1 className="text-xl font-extrabold text-slate-200">Access Denied</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Administrative privilege is required to access system diagnostics.
          </p>
          <Link href="/dashboard" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-2 rounded-xl transition-all">
            Return to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back navigation */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-all text-left"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Operations Dashboard
        </Link>

        {/* Header */}
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
            <Heart className="h-8 w-8 text-rose-500 shrink-0 animate-pulse" />
            Infrastructure System Health
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Realtime connection health, latency meters, and CPU/memory utilization telemetry.
          </p>
        </header>

        {loading ? (
          <div className="text-center py-24 text-slate-500 text-sm">Querying system endpoints...</div>
        ) : !health ? (
          <div className="text-center py-24 text-slate-500 text-sm">Failed to retrieve status flags.</div>
        ) : (
          <div className="space-y-8 text-left">
            
            {/* Services Status */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4">
              <h2 className="text-base font-bold text-slate-200 border-b border-white/5 pb-2">Active Services status</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(health.services).map(([service, status]) => (
                  <div key={service} className="bg-slate-950/40 p-4 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 capitalize">{service.replace("_", " ")}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold border ${
                      status === "Healthy"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Latency and System Utilization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Latencies */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4">
                <h3 className="text-base font-bold text-slate-200 border-b border-white/5 pb-2">Connection Latencies</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">REST API Gateway</span>
                    <span className="font-bold text-slate-200">{health.latencies.api_latency_ms} ms</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">MongoDB Database connection</span>
                    <span className="font-bold text-slate-200">{health.latencies.database_latency_ms} ms</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">watsonx granite inference connection</span>
                    <span className="font-bold text-slate-200">{health.latencies.ai_inference_latency_ms} ms</span>
                  </div>
                </div>
              </div>

              {/* Resource Utilization */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4">
                <h3 className="text-base font-bold text-slate-200 border-b border-white/5 pb-2">Host Resources</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">System Uptime</span>
                    <span className="font-bold text-slate-200">{health.system.uptime_hours} Hours</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">RAM Memory usage</span>
                    <span className="font-bold text-slate-200">{health.system.memory_usage_percent}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Host CPU utilisation</span>
                    <span className="font-bold text-slate-200">{health.system.cpu_utilization_percent}%</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}
