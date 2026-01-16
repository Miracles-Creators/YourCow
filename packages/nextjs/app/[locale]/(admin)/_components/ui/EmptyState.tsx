import type { ReactNode } from "react";
import { cn } from "~~/lib/utils/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * EmptyState - Placeholder for empty data views.
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-2 rounded-2xl border border-dashed border-vaca-neutral-gray-200 bg-vaca-neutral-white p-6",
        className,
      )}
    >
      <h3 className="text-base font-semibold text-vaca-neutral-gray-900">
        {title}
      </h3>
      {description ? (
        <p className="text-sm text-vaca-neutral-gray-500">{description}</p>
      ) : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
