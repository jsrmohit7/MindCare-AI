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
      className={`rounded-2xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md shadow-xl transition-all duration-300 ${
        hoverEffect ? "hover:border-indigo-500/30 hover:bg-slate-900/60 hover:-translate-y-1" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
