import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Assessment Service Error",
  message = "We encountered a network or validation error while processing the request.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/15 bg-rose-950/10 p-8 text-center backdrop-blur-xl max-w-md mx-auto my-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-5 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-6 border-rose-500/25 hover:bg-rose-500/10 hover:text-white" onClick={onRetry}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin-hover" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
}
