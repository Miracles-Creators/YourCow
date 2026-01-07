"use client";

import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "~~/lib/utils/cn";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  icon?: ReactNode;
  className?: string;
}

/**
 * Primary CTA Button - YourCow branded action button
 * Supports both button and link behavior
 */
export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  (
    {
      children,
      href,
      variant = "primary",
      size = "lg",
      icon,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles = cn(
      "inline-flex items-center justify-center gap-2 rounded-xl font-inter font-semibold",
      "transition-all duration-300 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-green focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    );

    const variantStyles = {
      primary: cn(
        "bg-vaca-green text-vaca-neutral-bg shadow-lg shadow-vaca-green/20",
        "hover:bg-vaca-green-light hover:shadow-xl hover:shadow-vaca-green/30 hover:-translate-y-0.5",
        "active:translate-y-0",
      ),
      secondary: cn(
        "bg-vaca-neutral-white text-vaca-green border-2 border-vaca-green/20",
        "hover:border-vaca-green hover:shadow-md",
      ),
    };

    const sizeStyles = {
      md: "px-6 py-3 text-sm",
      lg: "px-8 py-4 text-base",
    };

    const styles = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      className,
    );

    // Animated arrow icon
    const Arrow = () => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="transition-transform duration-300 group-hover:translate-x-1"
        aria-hidden="true"
      >
        <path
          d="M7.5 15L12.5 10L7.5 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

    const content = (
      <>
        {children}
        {icon || <Arrow />}
      </>
    );

    // Render as Link if href provided
    if (href && !disabled) {
      return (
        <Link href={href} className={cn(styles, "group")}>
          {content}
        </Link>
      );
    }

    // Render as Button
    return (
      <button ref={ref} className={cn(styles, "group")} disabled={disabled} {...props}>
        {content}
      </button>
    );
  },
);

PrimaryButton.displayName = "PrimaryButton";
