"use client";

import { motion } from "framer-motion";
import { cn } from "~~/lib/utils/cn";

export type ProgressBarColor = "green" | "blue" | "brown" | "neutral";
export type ProgressBarSize = "xs" | "sm" | "md" | "lg";

export interface ProgressBarProps {
  /** Progress value (0-100) */
  value: number;
  /** Optional label displayed below the bar */
  label?: string;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Bar size */
  size?: ProgressBarSize;
  /** Bar color */
  color?: ProgressBarColor;
  /** Enable animation on mount */
  animated?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const sizeStyles: Record<ProgressBarSize, string> = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

const colorStyles: Record<ProgressBarColor, string> = {
  green: "bg-vaca-green",
  blue: "bg-vaca-blue",
  brown: "bg-vaca-brown",
  neutral: "bg-vaca-neutral-gray-500",
};

/**
 * ProgressBar - Base progress bar component
 * Generic progress indicator with animation support.
 */
export function ProgressBar({
  value,
  label,
  showPercentage = false,
  size = "md",
  color = "green",
  animated = true,
  className,
}: ProgressBarProps) {
  // Clamp percentage between 0-100
  const clampedValue = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className={cn("w-full", className)}>
      {/* Header with label and percentage */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2 text-xs font-medium text-vaca-neutral-gray-500">
          {label && <span>{label}</span>}
          {showPercentage && (
            <span className="text-vaca-neutral-gray-600">{clampedValue}%</span>
          )}
        </div>
      )}

      {/* Progress bar track */}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-vaca-neutral-gray-200",
          sizeStyles[size],
        )}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `${clampedValue}% complete`}
      >
        {/* Progress bar fill */}
        {animated ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${clampedValue}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] as const }}
            className={cn("h-full rounded-full", colorStyles[color])}
          />
        ) : (
          <div
            className={cn("h-full rounded-full", colorStyles[color])}
            style={{ width: `${clampedValue}%` }}
          />
        )}
      </div>
    </div>
  );
}
