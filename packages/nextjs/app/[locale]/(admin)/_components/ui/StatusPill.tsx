import { Badge, type BadgeTone } from "~~/components/ui";

export type AdminStatusTone =
  | "approved"
  | "pending"
  | "rejected"
  | "flagged"
  | "info"
  | "asset"
  | "neutral";

interface StatusPillProps {
  label: string;
  tone?: AdminStatusTone;
  className?: string;
}

/**
 * Map admin-specific tones to shared Badge tones.
 * Flagged uses error with additional styling via className.
 */
const toneMap: Record<AdminStatusTone, BadgeTone> = {
  approved: "success",
  pending: "info",
  rejected: "error",
  flagged: "error",
  info: "info",
  asset: "warning",
  neutral: "neutral",
};

/**
 * Additional styles for tones that need differentiation from base Badge.
 */
const additionalStyles: Partial<Record<AdminStatusTone, string>> = {
  flagged: "bg-red-100", // More intense than rejected
  rejected: "bg-red-50", // Lighter red
};

/**
 * StatusPill - Compact status indicator for admin workflows.
 * Composes the shared Badge component with admin-specific tone mapping.
 */
export function StatusPill({
  label,
  tone = "neutral",
  className,
}: StatusPillProps) {
  return (
    <Badge
      tone={toneMap[tone]}
      size="md"
      variant="pill"
      className={additionalStyles[tone] ? `${additionalStyles[tone]} ${className ?? ""}` : className}
    >
      {label}
    </Badge>
  );
}
