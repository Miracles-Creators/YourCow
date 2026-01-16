"use client";

import { forwardRef } from "react";
import { Button, type ButtonProps } from "~~/components/ui";
import { cn } from "~~/lib/utils/cn";

interface PrimaryButtonProps extends Omit<ButtonProps, "variant" | "colorScheme"> {
  variant?: "primary" | "secondary";
}

/**
 * PrimaryButton - YourCow branded action button
 * Composes the shared Button component with investor branding.
 */
export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ variant = "primary", size = "lg", className, children, ...props }, ref) => {
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

    return (
      <Button
        ref={ref}
        variant={variant}
        colorScheme="green"
        size={size}
        icon={<Arrow />}
        iconPosition="right"
        className={cn(
          "hover:-translate-y-0.5 active:translate-y-0",
          className,
        )}
        {...props}
      >
        {children}
      </Button>
    );
  },
);

PrimaryButton.displayName = "PrimaryButton";
