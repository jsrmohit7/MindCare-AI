import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_12px_rgba(99,102,241,0.2)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.1),0_0_20px_rgba(99,102,241,0.35)] active:scale-[0.97] focus-visible:ring-indigo-500 border border-indigo-500/30",
  secondary:
    "bg-white/[0.04] text-slate-200 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] active:scale-[0.97] focus-visible:ring-white/30 hover:border-white/15",
  ghost:
    "text-slate-400 hover:text-white hover:bg-white/[0.04] active:scale-[0.97] focus-visible:ring-white/30",
  danger:
    "bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 active:scale-[0.97] focus-visible:ring-rose-500",
  outline:
    "border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/5 active:scale-[0.97] focus-visible:ring-indigo-500",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3.5 py-1.5 text-xs rounded-xl gap-1.5",
  md: "px-4.5 py-2 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-sm rounded-2xl gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = "",
      children,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center font-semibold
          transition-all duration-200 ease-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712]
          disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...rest}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />
        ) : leftIcon ? (
          <span className="shrink-0 transition-transform group-hover:scale-105" aria-hidden="true">{leftIcon}</span>
        ) : null}
        <span className="truncate">{children}</span>
        {!loading && rightIcon && (
          <span className="shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
