"use client";

import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "~~/lib/utils/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  colorScheme?: "green" | "blue" | "brown" | "neutral";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  className?: string;
}

/**
 * Button - Base button component
 * Generic button that supports multiple variants, sizes, and color schemes.
 * Feature-specific buttons should compose this component.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      href,
      variant = "primary",
      size = "md",
      colorScheme = "green",
      icon,
      iconPosition = "right",
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles = cn(
      "inline-flex items-center justify-center gap-2 font-inter font-semibold",
      "transition-all duration-200 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    );

    const sizeStyles = {
      sm: "px-4 py-2 text-sm rounded-lg",
      md: "px-6 py-3 text-sm rounded-xl",
      lg: "px-8 py-4 text-base rounded-xl",
    };

    const colorSchemes = {
      green: {
        ring: "focus-visible:ring-vaca-green",
        primary: "bg-vaca-green text-white hover:bg-vaca-green-light shadow-lg shadow-vaca-green/20 hover:shadow-xl",
        secondary: "bg-vaca-green/10 text-vaca-green hover:bg-vaca-green/20",
        outline: "border-2 border-vaca-green text-vaca-green hover:bg-vaca-green hover:text-white",
        ghost: "text-vaca-green hover:bg-vaca-green/10",
      },
      blue: {
        ring: "focus-visible:ring-vaca-blue",
        primary: "bg-vaca-blue text-white hover:bg-vaca-blue-light shadow-lg shadow-vaca-blue/20 hover:shadow-xl",
        secondary: "bg-vaca-blue/10 text-vaca-blue hover:bg-vaca-blue/20",
        outline: "border-2 border-vaca-blue text-vaca-blue hover:bg-vaca-blue hover:text-white",
        ghost: "text-vaca-blue hover:bg-vaca-blue/10",
      },
      brown: {
        ring: "focus-visible:ring-vaca-brown",
        primary: "bg-vaca-brown text-white hover:bg-vaca-brown-light shadow-lg shadow-vaca-brown/20 hover:shadow-xl",
        secondary: "bg-vaca-brown/10 text-vaca-brown hover:bg-vaca-brown/20",
        outline: "border-2 border-vaca-brown text-vaca-brown hover:bg-vaca-brown hover:text-white",
        ghost: "text-vaca-brown hover:bg-vaca-brown/10",
      },
      neutral: {
        ring: "focus-visible:ring-vaca-neutral-gray-400",
        primary: "bg-vaca-neutral-gray-700 text-white hover:bg-vaca-neutral-gray-600 shadow-lg",
        secondary: "bg-vaca-neutral-gray-100 text-vaca-neutral-gray-700 hover:bg-vaca-neutral-gray-200",
        outline: "border-2 border-vaca-neutral-gray-300 text-vaca-neutral-gray-700 hover:bg-vaca-neutral-gray-100",
        ghost: "text-vaca-neutral-gray-700 hover:bg-vaca-neutral-gray-100",
      },
    };

    const scheme = colorSchemes[colorScheme];

    const styles = cn(
      baseStyles,
      sizeStyles[size],
      scheme.ring,
      scheme[variant],
      fullWidth && "w-full",
      className,
    );

    const content = (
      <>
        {icon && iconPosition === "left" && icon}
        {children}
        {icon && iconPosition === "right" && icon}
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

Button.displayName = "Button";
