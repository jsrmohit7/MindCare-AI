import { ClipboardList } from "lucide-react";
import Link from "next/link";
import Button from "./Button";

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  actionHref?: string;
}

export default function EmptyState({
  title = "No Assessments Found",
  message = "You have not completed any mental health assessments yet. Take your first assessment to begin.",
  actionText = "Start Assessment",
  actionHref = "/assessment",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.04] bg-slate-900/20 p-12 text-center backdrop-blur-xl">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.05] text-slate-400 mb-6 shadow-inner">
        <ClipboardList className="h-6 w-6 text-indigo-400" />
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-xs text-slate-400 max-w-sm leading-relaxed">{message}</p>
      {actionHref && (
        <Link href={actionHref} className="mt-6">
          <Button variant="primary" size="sm">{actionText}</Button>
        </Link>
      )}
    </div>
  );
}
