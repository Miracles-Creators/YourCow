import type { ReactNode } from "react";
import { cn } from "~~/lib/utils/cn";

export type CardVariant = "default" | "bordered" | "elevated";
export type CardAccent = "none" | "green" | "blue" | "brown";

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  accent?: CardAccent;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-vaca-neutral-white",
  bordered: "bg-vaca-neutral-white border border-vaca-neutral-gray-200",
  elevated: "bg-vaca-neutral-white shadow-md hover:shadow-lg transition-shadow",
};

const accentStyles: Record<CardAccent, string> = {
  none: "",
  green: "border-l-4 border-l-vaca-green",
  blue: "border-l-4 border-l-vaca-blue",
  brown: "border-l-4 border-l-vaca-brown",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

/**
 * Card - Base card container component
 * Generic card that supports multiple variants, accents, and padding options.
 * Feature-specific cards should compose this component.
 */
export function Card({
  children,
  variant = "elevated",
  accent = "none",
  padding = "md",
  className,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl",
        variantStyles[variant],
        accentStyles[accent],
        paddingStyles[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

// Card subcomponents for composition
export interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
}

export interface CardTitleProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CardTitle({ children, size = "md", className }: CardTitleProps) {
  const sizeStyles = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <h3
      className={cn(
        "font-playfair font-semibold leading-tight tracking-tight text-vaca-neutral-gray-900",
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </h3>
  );
}

export interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={cn("text-sm text-vaca-neutral-gray-500 mt-1", className)}>
      {children}
    </p>
  );
}

export interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("", className)}>{children}</div>;
}

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn("mt-4 pt-4 border-t border-vaca-neutral-gray-100", className)}>
      {children}
    </div>
  );
}
