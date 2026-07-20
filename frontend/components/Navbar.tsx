"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Activity, History, ClipboardList, LayoutDashboard, User, LogIn, UserPlus, LogOut } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const authenticatedItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "New Assessment", path: "/assessment", icon: ClipboardList },
    { name: "History", path: "/history", icon: History },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const anonymousItems = [
    { name: "Login", path: "/login", icon: LogIn },
    { name: "Register", path: "/register", icon: UserPlus },
  ];

  const items = user ? authenticatedItems : anonymousItems;

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
          <div className="flex items-center space-x-2 sm:space-x-4">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-white/10 text-white shadow-inner"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              );
            })}
            
            {user && (
              <button
                onClick={logout}
                className="flex items-center space-x-2 rounded-xl px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
