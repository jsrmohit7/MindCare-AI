"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Activity,
  History,
  ClipboardList,
  LayoutDashboard,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Heart,
  Stethoscope,
  Menu,
  X,
  Bot,
  BookOpen,
  Target,
  Compass
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const authenticatedItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Assessment", path: "/assessment", icon: ClipboardList },
    { name: "History", path: "/history", icon: History },
    { name: "Daily Wellness", path: "/daily-checkin", icon: Heart },
    { name: "AI Coach", path: "/coach", icon: Bot },
    { name: "Mood Journal", path: "/journal", icon: BookOpen },
    { name: "Wellness Goals", path: "/goals", icon: Target },
    { name: "Journey Timeline", path: "/journey", icon: Compass },
    { name: "Consult", path: "/consult", icon: Stethoscope },
    { name: "Profile", path: "/profile", icon: User },
  ];



  const anonymousItems = [
    { name: "Login", path: "/login", icon: LogIn },
    { name: "Register", path: "/register", icon: UserPlus },
  ];

  const items = user ? authenticatedItems : anonymousItems;

  const isActive = (path: string) =>
    path === "/dashboard" ? pathname === path : pathname.startsWith(path);

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-2 group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-xl p-1"
              aria-label="MindCare AI – Home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg transition-transform duration-200 group-hover:scale-110">
                <Activity className="h-5 w-5 animate-pulse" aria-hidden="true" />
              </div>
              <span className="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
                MindCare AI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1" role="menubar">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  role="menuitem"
                  aria-current={active ? "page" : undefined}
                  className={`
                    relative flex items-center space-x-1.5 rounded-xl px-3 py-2 text-sm font-medium
                    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-950
                    ${active
                      ? "bg-indigo-600/20 text-white shadow-sm"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="hidden lg:inline">{item.name}</span>
                  {/* Active underline indicator */}
                  {active && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4/5 rounded-full bg-indigo-500"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}

            {user && (
              <button
                onClick={logout}
                className="flex items-center space-x-1.5 rounded-xl px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:ring-offset-slate-950"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen
                ? <X className="h-5 w-5" aria-hidden="true" />
                : <Menu className="h-5 w-5" aria-hidden="true" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-xl"
          style={{ animation: "slideDown 150ms ease-out" }}
          role="menu"
          aria-label="Mobile navigation"
        >
          <div className="px-4 py-3 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  role="menuitem"
                  aria-current={active ? "page" : undefined}
                  className={`
                    flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500
                    ${active
                      ? "bg-indigo-600/20 text-white border border-indigo-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{item.name}</span>
                  {active && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
                  )}
                </Link>
              );
            })}

            {user && (
              <button
                onClick={logout}
                role="menuitem"
                className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Slide-down animation */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  );
}
