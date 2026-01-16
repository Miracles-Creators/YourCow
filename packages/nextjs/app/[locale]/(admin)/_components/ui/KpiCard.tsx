import type { ReactNode } from "react";
import { Card } from "~~/components/ui";
import { cn } from "~~/lib/utils/cn";

export type KpiTone = "default" | "success" | "info" | "warning" | "danger";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  icon?: ReactNode;
  tone?: KpiTone;
  className?: string;
}

/**
 * Border color styles for each tone.
 * Applied as additional className since Card bordered uses neutral border.
 */
const toneBorderStyles: Record<KpiTone, string> = {
  default: "",
  success: "border-vaca-green/40",
  info: "border-vaca-blue/40",
  warning: "border-vaca-brown/40",
  danger: "border-red-300",
};

const toneValueStyles: Record<KpiTone, string> = {
  default: "text-vaca-neutral-gray-900",
  success: "text-vaca-green",
  info: "text-vaca-blue",
  warning: "text-vaca-brown",
  danger: "text-red-700",
};

/**
 * KpiCard - Compact KPI card for admin dashboard metrics.
 * Composes the shared Card component with admin-specific styling.
 */
export function KpiCard({
  label,
  value,
  delta,
  icon,
  tone = "default",
  className,
}: KpiCardProps) {
  return (
    <Card
      variant="bordered"
      padding="md"
      className={cn("shadow-sm", toneBorderStyles[tone], className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-vaca-neutral-gray-500">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 font-playfair text-2xl font-semibold",
              toneValueStyles[tone],
            )}
          >
            {value}
          </p>
        </div>
        {icon && (
          <div className="text-vaca-neutral-gray-400" aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
      {delta && (
        <p className="mt-2 text-xs text-vaca-neutral-gray-500">{delta}</p>
      )}
    </Card>
  );
}
