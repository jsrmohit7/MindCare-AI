import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = "Analyzing assessment data using Watsonx AI..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin absolute" />
        <Loader2 className="h-8 w-8 text-purple-400 animate-pulse" />
      </div>
      <p className="mt-6 text-sm font-semibold tracking-wide bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent animate-pulse max-w-sm leading-relaxed">
        {message}
      </p>
    </div>
  );
}
