import { Badge, type BadgeTone } from "~~/components/ui";

export type StatusTone = "success" | "info" | "warning" | "neutral";

interface StatusPillProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

/**
 * StatusPill - Producer-specific status indicator
 * Composes the shared Badge component.
 */
export function StatusPill({
  label,
  tone = "neutral",
  className,
}: StatusPillProps) {
  // Map StatusTone to BadgeTone (they're compatible)
  const badgeTone: BadgeTone = tone;

  return (
    <Badge tone={badgeTone} size="md" variant="pill" className={className}>
      {label}
    </Badge>
  );
}
