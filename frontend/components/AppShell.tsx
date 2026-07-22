"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { AmbientBackground } from "@/components/AmbientBackground";

// Pages that should use the full-width public layout (no sidebar)
const PUBLIC_ROUTES = ["/login", "/register", "/"];

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || pathname === "/";

  // For public routes or unauthenticated users, render without sidebar
  if (isPublicRoute || !user) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <AmbientBackground />
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] relative">
      <AmbientBackground />
      
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0 relative z-20">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative z-10">
        {/* Scrollable content */}
        <main
          className="flex-1 overflow-y-auto pb-20 md:pb-0"
          id="main-content"
          aria-label="Main content area"
        >
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="relative z-20">
        <MobileNav />
      </div>
    </div>
  );
}
