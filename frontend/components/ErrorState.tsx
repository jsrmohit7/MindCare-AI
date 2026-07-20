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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-950/20 p-8 text-center backdrop-blur-sm max-w-md mx-auto my-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-6 border-rose-500/20 hover:bg-rose-500/10" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
}
