"use client";

import { ProgressBar as BaseProgressBar, type ProgressBarProps as BaseProps } from "~~/components/ui";

interface ProgressBarProps extends Omit<BaseProps, "showPercentage"> {
  /** Progress value (0-100) */
  percentage: number;
}

/**
 * ProgressBar - Investor-specific progress bar
 * Re-exports the shared ProgressBar with investor-friendly prop names.
 * Used in InvestmentCard for lot funding status.
 */
export function ProgressBar({
  percentage,
  label,
  size = "md",
  color = "green",
  animated = true,
  className,
}: ProgressBarProps) {
  return (
    <BaseProgressBar
      value={percentage}
      label={label}
      size={size}
      color={color}
      animated={animated}
      className={className}
    />
  );
}
