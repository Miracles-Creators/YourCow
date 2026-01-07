import type { ReactNode } from "react";
import { cn } from "~~/lib/utils/cn";

interface InfoSectionProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  variant?: "default" | "traceability";
  className?: string;
}

/**
 * InfoSection - Sectioned content wrapper
 * Used in Lot Detail screen for organized information display
 */
export function InfoSection({
  title,
  children,
  icon,
  variant = "default",
  className,
}: InfoSectionProps) {
  const variantStyles = {
    default: "text-vaca-neutral-gray-900",
    traceability: "text-vaca-brown", // Brown accent for traceability
  };

  return (
    <section className={cn("mb-8", className)}>
      {/* Section Header */}
      <div className="mb-4 flex items-center gap-3">
        {icon && (
          <div
            className={cn(
              "flex-shrink-0",
              variant === "traceability"
                ? "text-vaca-brown"
                : "text-vaca-neutral-gray-400",
            )}
          >
            {icon}
          </div>
        )}
        <h2
          className={cn(
            "font-playfair text-2xl font-semibold leading-tight tracking-tight",
            variantStyles[variant],
          )}
        >
          {title}
        </h2>
      </div>

      {/* Divider */}
      <div
        className={cn(
          "mb-6 h-px",
          variant === "traceability"
            ? "bg-vaca-brown/20"
            : "bg-vaca-neutral-gray-200",
        )}
      />

      {/* Content */}
      <div className="font-inter text-base leading-relaxed text-vaca-neutral-gray-700">
        {children}
      </div>
    </section>
  );
}
