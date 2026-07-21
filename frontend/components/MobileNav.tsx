"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Bot,
  Heart,
  BookOpen,
  Target,
  Compass,
} from "lucide-react";

const MOBILE_NAV = [
  { label: "Today", path: "/dashboard", icon: LayoutDashboard },
  { label: "Coach", path: "/coach", icon: Bot },
  { label: "Check-in", path: "/daily-checkin", icon: Heart },
  { label: "Journal", path: "/journal", icon: BookOpen },
  { label: "Goals", path: "/goals", icon: Target },
  { label: "Journey", path: "/journey", icon: Compass },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isActive = (path: string) =>
    path === "/dashboard" ? pathname === path : pathname.startsWith(path);

  return (
    <nav
      className="fixed bottom-4 left-4 right-4 z-50 md:hidden border border-white/[0.05] bg-slate-950/80 backdrop-blur-2xl rounded-2xl shadow-2xl"
      aria-label="Mobile navigation"
    >
      <ul className="flex items-center justify-around px-2 py-1.5" role="list">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <li key={item.path} className="flex-1">
              <Link
                href={item.path}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={`
                  relative flex flex-col items-center gap-1 rounded-xl py-2 px-1 text-[9px] font-bold
                  transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                  ${active ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"}
                `}
              >
                <Icon
                  className={`h-4.5 w-4.5 transition-all ${active ? "scale-110 text-indigo-400" : "text-slate-500"}`}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
                {active && (
                  <span
                    className="absolute bottom-0 h-1 w-1 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.8)]"
                    aria-hidden="true"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
