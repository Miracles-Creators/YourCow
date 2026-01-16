import type { ReactNode } from "react";
import { cn } from "~~/lib/utils/cn";

export type SectionAccent = "default" | "green" | "blue" | "brown";

export interface SectionProps {
  title: string;
  children: ReactNode;
  /** Optional description below the title */
  description?: string;
  /** Optional icon displayed before the title */
  icon?: ReactNode;
  /** Color accent for title and divider */
  accent?: SectionAccent;
  /** Show divider below header */
  divider?: boolean;
  /** Additional CSS classes for the section */
  className?: string;
  /** Additional CSS classes for the content wrapper */
  contentClassName?: string;
}

const accentTitleStyles: Record<SectionAccent, string> = {
  default: "text-vaca-neutral-gray-900",
  green: "text-vaca-green",
  blue: "text-vaca-blue",
  brown: "text-vaca-brown",
};

const accentIconStyles: Record<SectionAccent, string> = {
  default: "text-vaca-neutral-gray-400",
  green: "text-vaca-green",
  blue: "text-vaca-blue",
  brown: "text-vaca-brown",
};

const accentDividerStyles: Record<SectionAccent, string> = {
  default: "bg-vaca-neutral-gray-200",
  green: "bg-vaca-green/20",
  blue: "bg-vaca-blue/20",
  brown: "bg-vaca-brown/20",
};

/**
 * Section - Content section wrapper with header
 * Used for organizing content into labeled sections.
 */
export function Section({
  title,
  children,
  description,
  icon,
  accent = "default",
  divider = true,
  className,
  contentClassName,
}: SectionProps) {
  return (
    <section className={cn("mb-8", className)}>
      {/* Section Header */}
      <div className="mb-4 flex items-center gap-3">
        {icon && (
          <div className={cn("flex-shrink-0", accentIconStyles[accent])}>
            {icon}
          </div>
        )}
        <div>
          <h2
            className={cn(
              "font-playfair text-2xl font-semibold leading-tight tracking-tight",
              accentTitleStyles[accent],
            )}
          >
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-vaca-neutral-gray-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      {divider && (
        <div className={cn("mb-6 h-px", accentDividerStyles[accent])} />
      )}

      {/* Content */}
      <div
        className={cn(
          "font-inter text-base leading-relaxed text-vaca-neutral-gray-700",
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
