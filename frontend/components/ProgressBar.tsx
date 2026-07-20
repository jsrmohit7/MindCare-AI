interface ProgressBarProps {
  progress: number; // 0 to 100
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-semibold text-indigo-300 mb-1.5">
        <span>Completion Progress</span>
        <span>{Math.round(clampedProgress)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900 border border-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
