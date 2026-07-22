"use client";

import React from "react";
import { Phone, MessageSquare, AlertCircle, ShieldAlert, Heart } from "lucide-react";

export function EmergencyBanner() {
  return (
    <div className="relative rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 backdrop-blur-3xl shadow-xl space-y-4 overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-rose-500/20 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-black uppercase tracking-wider">
            <ShieldAlert className="h-4 w-4" />
            <span>Crisis & Emergency Support</span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-white">
            Need Immediate Help or Experiencing a Mental Health Crisis?
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Free, confidential support is available 24/7. You are not alone—connect immediately with trained crisis counselors.
          </p>
        </div>

        <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
          <Heart className="h-6 w-6 animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* 988 Suicide & Crisis Lifeline */}
        <a
          href="tel:988"
          className="p-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 border border-rose-400 text-white font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md shadow-rose-500/20 active:scale-95"
        >
          <Phone className="h-4 w-4" />
          <span>Call or Text 988</span>
        </a>

        {/* Crisis Text Line */}
        <a
          href="sms:741741?body=HOME"
          className="p-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white font-bold text-xs flex items-center justify-center gap-2.5 transition-all active:scale-95"
        >
          <MessageSquare className="h-4 w-4 text-emerald-400" />
          <span>Text HOME to 741741</span>
        </a>

        {/* Emergency Services */}
        <a
          href="tel:911"
          className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-rose-300 font-bold text-xs flex items-center justify-center gap-2.5 transition-all active:scale-95"
        >
          <AlertCircle className="h-4 w-4 text-rose-400" />
          <span>Emergency: Dial 911</span>
        </a>
      </div>

      <div className="text-[10px] text-slate-400 italic pt-1 border-t border-rose-500/20">
        <strong>Disclaimer:</strong> MindCare AI services provide wellness coaching and clinical tracking only and do not constitute emergency medical services.
      </div>
    </div>
  );
}
