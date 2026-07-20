import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  isLoading = false,
  disabled = false,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyle =
    "relative flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95";

  const variants = {
    primary:
      "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:brightness-110 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30",
    secondary:
      "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white",
    danger:
      "bg-gradient-to-r from-rose-500 to-red-600 text-white hover:brightness-110 shadow-lg shadow-rose-500/20",
    ghost:
      "text-slate-400 hover:bg-white/5 hover:text-white",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
