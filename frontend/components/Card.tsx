import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export default function Card({
  children,
  className = "",
  hoverEffect = false,
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.05] bg-slate-900/40 p-6 backdrop-blur-xl shadow-xl transition-all duration-300 ${
        hoverEffect ? "hover:border-indigo-500/20 hover:bg-slate-900/60 hover:-translate-y-0.5 hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.6),0_0_20px_rgba(99,102,241,0.04)]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
