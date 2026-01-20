"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "~~/lib/utils/cn";

interface FormRowProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Error message (replaces helperText when present) */
  error?: string;
  /** Make the field optional */
  optional?: boolean;
}

/**
 * FormRow - Label + Input + Helper/Error wrapper
 * Consistent form field layout for onboarding forms
 */
export const FormRow = forwardRef<HTMLInputElement, FormRowProps>(
  (
    {
      label,
      helperText,
      error,
      optional,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="mb-2 flex items-center gap-1 font-inter text-sm font-medium text-vaca-neutral-gray-700"
        >
          {label}
          {optional && (
            <span className="text-vaca-neutral-gray-400">(optional)</span>
          )}
        </label>

        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-xl border-2 px-4 py-3 font-inter text-base transition-colors duration-200",
            "bg-vaca-neutral-white text-vaca-neutral-gray-900",
            "placeholder:text-vaca-neutral-gray-400",
            "focus:outline-none focus:ring-0",
            error
              ? "border-red-500 focus:border-red-500"
              : "border-vaca-neutral-gray-200 focus:border-vaca-green",
            "disabled:cursor-not-allowed disabled:bg-vaca-neutral-gray-100 disabled:text-vaca-neutral-gray-400",
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

FormRow.displayName = "FormRow";
