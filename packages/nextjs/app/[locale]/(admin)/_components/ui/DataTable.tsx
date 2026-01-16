import type { ReactNode } from "react";
import { cn } from "~~/lib/utils/cn";

interface DataTableProps {
  children: ReactNode;
  caption?: string;
  ariaLabel?: string;
  className?: string;
  tableClassName?: string;
}

/**
 * DataTable - Simple table wrapper with accessibility defaults.
 */
export function DataTable({
  children,
  caption,
  ariaLabel,
  className,
  tableClassName,
}: DataTableProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white",
        className,
      )}
    >
      <table
        className={cn(
          "w-full border-collapse text-left text-sm",
          tableClassName,
        )}
        aria-label={caption ? undefined : ariaLabel}
      >
        {caption ? (
          <caption className="sr-only">{caption}</caption>
        ) : null}
        {children}
      </table>
    </div>
  );
}
