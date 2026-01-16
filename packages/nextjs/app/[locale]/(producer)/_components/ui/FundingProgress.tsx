import { ProgressBar } from "~~/components/ui";
import { cn } from "~~/lib/utils/cn";

interface FundingProgressProps {
  value: number;
  label?: string;
  className?: string;
}

/**
 * FundingProgress - Producer-specific funding progress bar
 * Composes the shared ProgressBar with producer-specific defaults.
 */
export function FundingProgress({
  value,
  label = "Funding",
  className,
}: FundingProgressProps) {
  return (
    <ProgressBar
      value={value}
      label={label}
      showPercentage
      size="md"
      color="green"
      animated={false}
      className={cn("space-y-2", className)}
    />
  );
}
