"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, History, ClipboardList } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "New Assessment", path: "/assessment", icon: ClipboardList },
    { name: "History", path: "/history", icon: History },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg transition-transform group-hover:scale-110">
                <Activity className="h-5 w-5 animate-pulse" />
              </div>
              <span className="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
                MindCare AI
              </span>
            </Link>
          </div>
          <div className="flex space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-white/10 text-white shadow-inner"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
