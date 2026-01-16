import type { ReactNode } from "react";
import { cn } from "~~/lib/utils/cn";

export type BadgeTone = "success" | "info" | "warning" | "error" | "neutral";
export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  size?: BadgeSize;
  /** Show as pill (fully rounded) or tag (slightly rounded) */
  variant?: "pill" | "tag";
  /** Optional icon to display before the text */
  icon?: ReactNode;
  className?: string;
}

const toneStyles: Record<BadgeTone, string> = {
  success: "bg-vaca-green/10 text-vaca-green",
  info: "bg-vaca-blue/10 text-vaca-blue",
  warning: "bg-vaca-brown/10 text-vaca-brown",
  error: "bg-red-100 text-red-700",
  neutral: "bg-vaca-neutral-gray-100 text-vaca-neutral-gray-700",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

const variantStyles = {
  pill: "rounded-full",
  tag: "rounded-md",
};

/**
 * Badge - Base badge/pill component
 * Generic status indicator that supports multiple tones and sizes.
 */
export function Badge({
  children,
  tone = "neutral",
  size = "md",
  variant = "pill",
  icon,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold",
        toneStyles[tone],
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
