import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "~~/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Error message (replaces helperText when present) */
  error?: string;
  /** Input size variant */
  inputSize?: "sm" | "md" | "lg";
  /** Full width input */
  fullWidth?: boolean;
}

const sizeStyles = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-base",
  lg: "px-5 py-4 text-lg",
};

/**
 * Input - Base input component
 * Generic text input with label, helper text, and error states.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      inputSize = "md",
      fullWidth = false,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className={cn("flex flex-col", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 font-inter text-sm font-medium text-vaca-neutral-gray-700"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            "rounded-xl border-2 font-inter transition-colors duration-200",
            "bg-vaca-neutral-white text-vaca-neutral-gray-900",
            "placeholder:text-vaca-neutral-gray-400",
            "focus:outline-none focus:ring-0",
            error
              ? "border-red-500 focus:border-red-500"
              : "border-vaca-neutral-gray-200 focus:border-vaca-green",
            "disabled:bg-vaca-neutral-gray-100 disabled:text-vaca-neutral-gray-400 disabled:cursor-not-allowed",
            sizeStyles[inputSize],
            fullWidth && "w-full",
            className,
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />

        {error ? (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={`${inputId}-helper`}
            className="mt-2 text-sm text-vaca-neutral-gray-500"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
