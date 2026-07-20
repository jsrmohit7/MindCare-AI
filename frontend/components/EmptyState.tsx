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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-slate-900/10 p-12 text-center backdrop-blur-md">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-400">
        <ClipboardList className="h-7 w-7" />
      </div>
      <h3 className="mt-6 text-xl font-bold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-400 max-w-sm leading-relaxed">{message}</p>
      {actionHref && (
        <Link href={actionHref} className="mt-6">
          <Button variant="primary">{actionText}</Button>
        </Link>
      )}
    </div>
  );
}
