"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  Target,
  Compass,
  ClipboardList,
  History,
  Heart,
  Stethoscope,
  ShieldAlert,
  Settings,
  LogOut,
  Activity,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Today", path: "/dashboard", icon: LayoutDashboard, group: "core" },
  { label: "AI Coach", path: "/coach", icon: Bot, group: "core" },
  { label: "Daily Check-in", path: "/daily-checkin", icon: Heart, group: "core" },
  { label: "Journal", path: "/journal", icon: BookOpen, group: "wellness" },
  { label: "Goals", path: "/goals", icon: Target, group: "wellness" },
  { label: "Journey", path: "/journey", icon: Compass, group: "wellness" },
  { label: "Assessment", path: "/assessment", icon: ClipboardList, group: "tools" },
  { label: "History", path: "/history", icon: History, group: "tools" },
  { label: "Consult", path: "/consult", icon: Stethoscope, group: "tools" },
] as const;

const BOTTOM_ITEMS = [
  { label: "Profile", path: "/profile", icon: User },
  { label: "Privacy", path: "/privacy", icon: ShieldAlert },
  { label: "Settings", path: "/settings", icon: Settings },
];

const GROUPS: Record<string, string> = {
  core: "Main Workspace",
  wellness: "Wellness Journey",
  tools: "Assessments & Care",
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (path: string) =>
    path === "/dashboard" ? pathname === path : pathname.startsWith(path);

  const adminItems = user?.role === "admin" || user?.email?.includes("admin")
    ? [{ label: "Admin Operations", path: "/admin", icon: Shield }]
    : [];

  const allBottomItems = [...adminItems, ...BOTTOM_ITEMS];
  const groups = ["core", "wellness", "tools"];

  return (
    <aside
      className={`
        flex flex-col h-full transition-all duration-300 ease-in-out
        bg-slate-950/70 backdrop-blur-2xl border-r border-white/[0.04]
        ${collapsed ? "w-[68px]" : "w-[240px]"}
      `}
      aria-label="Main sidebar navigation"
    >
      {/* Logo Container */}
      <div className={`flex items-center h-16 shrink-0 px-4 border-b border-white/[0.04] ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
            aria-label="MindCare AI home"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 shadow-md shadow-indigo-500/10 group-hover:scale-105 transition-transform">
              <Activity className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              MindCare AI
            </span>
          </Link>
        )}
        {collapsed && (
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 shadow-md shadow-indigo-500/10 hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="MindCare AI home"
          >
            <Activity className="h-4 w-4 text-white" aria-hidden="true" />
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Collapsed Toggle Option */}
      {collapsed && (
        <div className="flex justify-center py-2 border-b border-white/[0.04]">
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-6 no-scrollbar" aria-label="Primary navigation">
        {groups.map((group) => {
          const groupItems = NAV_ITEMS.filter((item) => item.group === group);
          return (
            <div key={group} className="space-y-1">
              {!collapsed && (
                <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500/80">
                  {GROUPS[group]}
                </p>
              )}
              <ul className="space-y-0.5 px-2" role="list">
                {groupItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                        className={`
                          relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold
                          transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                          ${collapsed ? "justify-center" : ""}
                          ${active
                            ? "bg-indigo-600/10 text-indigo-300 border border-indigo-500/10"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent"
                          }
                        `}
                      >
                        {active && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-indigo-500"
                            aria-hidden="true"
                          />
                        )}
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-indigo-400" : ""}`}
                          aria-hidden="true"
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Profile Card & Settings Rail */}
      <div className="shrink-0 border-t border-white/[0.04] py-4 px-2 space-y-2">
        {/* User Card */}
        {!collapsed && user && (
          <div className="mx-2 mb-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-2.5">
            <div className="h-8.5 w-8.5 rounded-lg bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold">
              {user.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{user.full_name}</p>
              <p className="text-[9px] text-slate-500 font-semibold truncate capitalize">{user.role || "patient"}</p>
            </div>
          </div>
        )}

        {/* Action Items */}
        <div className="space-y-0.5">
          {allBottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={`
                  flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold
                  transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                  ${collapsed ? "justify-center" : ""}
                  ${active
                    ? "bg-indigo-600/10 text-indigo-300 border border-indigo-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent"
                  }
                `}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {user && (
            <button
              onClick={logout}
              title={collapsed ? "Log out" : undefined}
              className={`
                w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold
                text-slate-400 hover:text-rose-400 hover:bg-rose-500/[0.06] border border-transparent hover:border-rose-500/10
                transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500
                ${collapsed ? "justify-center" : ""}
              `}
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">Log out</span>}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
