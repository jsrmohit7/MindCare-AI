"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { ClipboardList, History, User, Heart, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  const cards = [
    {
      title: "New Assessment",
      description: "Start a comprehensive cognitive and emotional health evaluation powered by AI.",
      icon: ClipboardList,
      color: "from-blue-500 to-indigo-600",
      link: "/assessment",
      actionText: "Start Assessment",
    },
    {
      title: "Assessment History",
      description: "View and track your previous assessment results, trends, and mental health metrics.",
      icon: History,
      color: "from-purple-500 to-pink-600",
      link: "/history",
      actionText: "View History",
    },
    {
      title: "Your Profile",
      description: "Manage your account parameters, role privileges, and personal information details.",
      icon: User,
      color: "from-teal-500 to-emerald-600",
      link: "/profile",
      actionText: "Manage Profile",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-8 py-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-12 h-36 w-36 rounded-full bg-pink-500/5 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                <Sparkles className="h-3 w-3 animate-spin" />
                <span>MindCare AI Copilot Active</span>
              </div>
              <h1 className="bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
                Welcome back, {user?.full_name || "User"}
              </h1>
              <p className="max-w-2xl text-slate-400 text-sm sm:text-base leading-relaxed">
                Take a moment to check in with yourself. Use our AI-powered assessments to evaluate stress levels, anxiety, depression, and lifestyle factors.
              </p>
            </div>
            
            <div className="flex shrink-0 items-center space-x-2 rounded-2xl bg-white/5 p-4 border border-white/5">
              <Heart className="h-8 w-8 text-pink-500 animate-pulse" />
              <div>
                <div className="text-xs text-slate-400 font-medium">Status</div>
                <div className="text-sm font-semibold text-white">Monitoring Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-slate-900/60 shadow-lg"
              >
                <div className="space-y-4">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg shadow-black/20`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>
                
                <div className="mt-6">
                  <Link
                    href={card.link}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 border border-white/10 transition-all duration-300"
                  >
                    {card.actionText}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer Notice */}
        <div className="flex items-start space-x-3 rounded-2xl border border-white/5 bg-slate-950/40 p-5 text-xs text-slate-500">
          <ShieldAlert className="h-5 w-5 shrink-0 text-slate-400" />
          <p className="leading-relaxed">
            <strong>Disclaimer:</strong> MindCare AI assessments are designed for self-reflection and educational purposes only. They do not constitute medical diagnoses or professional psychiatric advice. If you are experiencing acute emotional distress or require medical attention, please contact a licensed mental health professional or emergency medical services immediately.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
