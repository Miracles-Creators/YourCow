import type { ReactNode } from "react";
import { cn } from "~~/lib/utils/cn";

interface ReviewPanelProps {
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * ReviewPanel - Right-side action panel for approve/reject workflows.
 */
export function ReviewPanel({
  title = "Review Actions",
  description,
  children,
  footer,
  className,
}: ReviewPanelProps) {
  return (
    <aside
      className={cn(
        "rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="border-b border-vaca-neutral-gray-100 pb-4">
        <h2 className="text-lg font-semibold text-vaca-neutral-gray-900">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm text-vaca-neutral-gray-500">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </aside>
  );
}
