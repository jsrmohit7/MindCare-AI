"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAssessments } from "@/hooks/useAssessments";
import {
  LayoutDashboard,
  Bot,
  Heart,
  BookOpen,
  Target,
  Menu,
  X,
  ClipboardList,
  TrendingUp,
  History,
  Calendar,
  Stethoscope,
  User,
  Settings,
  ShieldAlert,
  LogOut,
  Shield,
  Cpu,
  Activity,
} from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch assessments context to build direct results link
  const { data: assessments } = useAssessments(1);
  const latestAssessmentId = assessments?.[0]?.id;

  // Lock body scroll when overlay is active
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen]);

  if (!user) return null;

  const isAdmin = user.role === "admin" || user.email?.includes("admin");

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const resultsPath = latestAssessmentId ? `/results/${latestAssessmentId}` : "/history";

  const mainNavItems = [
    { label: "Today", path: "/dashboard", icon: LayoutDashboard },
    { label: "Coach", path: "/coach", icon: Bot },
    { label: "Check-in", path: "/daily-checkin", icon: Heart },
    { label: "Journal", path: "/journal", icon: BookOpen },
    { label: "Goals", path: "/goals", icon: Target },
  ];

  return (
    <>
      <nav
        className="fixed bottom-4 left-4 right-4 z-50 md:hidden border border-white/[0.05] bg-slate-950/80 backdrop-blur-2xl rounded-2xl shadow-2xl"
        aria-label="Mobile navigation"
      >
        <ul className="flex items-center justify-around px-2 py-1.5" role="list">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <li key={item.path} className="flex-1">
                <Link
                  href={item.path}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={`
                    relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-2.5 px-0.5 text-[8px] sm:text-[9px] font-bold tracking-tight
                    transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                    min-h-[46px] select-none
                    ${active ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"}
                  `}
                >
                  <Icon
                    className={`h-[18px] w-[18px] transition-all ${active ? "scale-110 text-indigo-400" : "text-slate-500"}`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                  {active && (
                    <span
                      className="absolute bottom-1.5 h-1 w-1 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.8)]"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            );
          })}
          {/* More menu item button */}
          <li className="flex-1">
            <button
              onClick={() => setIsOpen(true)}
              aria-expanded={isOpen}
              aria-label="Open navigation menu"
              className="w-full relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-2.5 px-0.5 text-[8px] sm:text-[9px] font-bold tracking-tight text-slate-500 hover:text-slate-300 min-h-[46px] select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Menu className="h-[18px] w-[18px] transition-all" aria-hidden="true" />
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Mobile Full-Screen Sheet Overlay Drawer */}
      <div
        className={`
          fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-3xl transition-all duration-300 ease-in-out px-6 py-8 flex flex-col justify-between overflow-y-auto no-scrollbar md:hidden
          ${isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
              <Activity className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-xs font-black text-white uppercase tracking-wider">MindCare AI X</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white transition-all active:scale-90"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable menu options */}
        <div className="flex-1 py-6 space-y-6 overflow-y-auto no-scrollbar">
          {/* Group 1: Wellness */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3">Wellness</h3>
            <ul className="space-y-0.5" role="list">
              {[
                { label: "Assessment", path: "/assessment", icon: ClipboardList },
                { label: "Results", path: resultsPath, icon: TrendingUp },
                { label: "History Log", path: "/history", icon: History },
                { label: "Daily History", path: "/daily-history", icon: Calendar },
                { label: "Clinical Locator", path: "/consult", icon: Stethoscope },
              ].map((item) => {
                const Icon = item.icon;
                const active = pathname === item.path || (item.path !== "/history" && pathname.startsWith(item.path));
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs font-bold transition-all min-h-[44px]
                        ${active
                          ? "bg-indigo-600/10 text-indigo-300 border border-indigo-500/10"
                          : "text-slate-400 hover:text-slate-200 bg-transparent border border-transparent"
                        }
                      `}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-indigo-400" : ""}`} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Group 2: Account */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3">Account</h3>
            <ul className="space-y-0.5" role="list">
              {[
                { label: "Profile Details", path: "/profile", icon: User },
                { label: "Settings", path: "/settings", icon: Settings },
                { label: "Privacy Center", path: "/privacy", icon: ShieldAlert },
              ].map((item) => {
                const Icon = item.icon;
                const active = pathname === item.path || pathname.startsWith(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs font-bold transition-all min-h-[44px]
                        ${active
                          ? "bg-indigo-600/10 text-indigo-300 border border-indigo-500/10"
                          : "text-slate-400 hover:text-slate-200 bg-transparent border border-transparent"
                        }
                      `}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-indigo-400" : ""}`} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Group 3: Administration (if admin role) */}
          {isAdmin && (
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3">Administration</h3>
              <ul className="space-y-0.5" role="list">
                {[
                  { label: "Admin Operations", path: "/admin", icon: Shield },
                  { label: "System Telemetry", path: "/admin/system", icon: Cpu },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`
                          flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs font-bold transition-all min-h-[44px]
                          ${active
                            ? "bg-indigo-600/10 text-indigo-300 border border-indigo-500/10"
                            : "text-slate-400 hover:text-slate-200 bg-transparent border border-transparent"
                          }
                        `}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${active ? "text-indigo-400" : ""}`} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Footer/Logout Action */}
        <div className="border-t border-white/[0.05] pt-4 shrink-0 pb-6">
          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 text-rose-400 hover:text-white font-bold text-xs py-3.5 transition-all active:scale-[0.98] min-h-[44px]"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </>
  );
}
