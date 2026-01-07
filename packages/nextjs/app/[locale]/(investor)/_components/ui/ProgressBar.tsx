"use client";

import { motion } from "framer-motion";
import { cn } from "~~/lib/utils/cn";

interface ProgressBarProps {
  percentage: number;
  label?: string;
  size?: "sm" | "md";
  color?: "green" | "blue";
  animated?: boolean;
  className?: string;
}

/**
 * ProgressBar - Show funding progress
 * Used in InvestmentCard for lot funding status
 */
export function ProgressBar({
  percentage,
  label,
  size = "md",
  color = "green",
  animated = true,
  className,
}: ProgressBarProps) {
  const sizeStyles = {
    sm: "h-1",
    md: "h-2",
  };

  const colorStyles = {
    green: "bg-vaca-green",
    blue: "bg-vaca-blue",
  };

  // Clamp percentage between 0-100
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar track */}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-vaca-neutral-gray-200",
          sizeStyles[size],
        )}
        role="progressbar"
        aria-valuenow={clampedPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `${clampedPercentage}% complete`}
      >
        {/* Progress bar fill */}
        {animated ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${clampedPercentage}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] as const }}
            className={cn("h-full rounded-full", colorStyles[color])}
          />
        ) : (
          <div
            className={cn("h-full rounded-full", colorStyles[color])}
            style={{ width: `${clampedPercentage}%` }}
          />
        )}
      </div>

      {/* Label (optional) */}
      {label && (
        <p className="mt-1.5 font-inter text-xs text-vaca-neutral-gray-500">
          {label}
        </p>
      )}
    </div>
  );
}
