"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "~~/lib/utils/cn";

interface PhoneInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  helperText?: string;
  error?: string;
  countryCode?: string;
}

// Country codes for phone input
const COUNTRY_CODES = [
  { code: "+54", country: "AR", flag: "🇦🇷" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+598", country: "UY", flag: "🇺🇾" },
  { code: "+595", country: "PY", flag: "🇵🇾" },
  { code: "+56", country: "CL", flag: "🇨🇱" },
  { code: "+57", country: "CO", flag: "🇨🇴" },
  { code: "+52", country: "MX", flag: "🇲🇽" },
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+34", country: "ES", flag: "🇪🇸" },
] as const;

/**
 * PhoneInput - Phone number input with country code selector
 * Includes basic formatting and validation
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      label,
      helperText,
      error,
      countryCode = "+54",
      className,
      id,
      onChange,
      ...props
    },
    ref,
  ) => {
    const inputId = id || "phone-input";
    const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block font-inter text-sm font-medium text-vaca-neutral-gray-700"
          >
            {label}
          </label>
        )}

        <div className="flex gap-2">
          {/* Country code selector */}
          <div
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-xl border-2 px-3 py-3",
              "bg-vaca-neutral-gray-50 text-vaca-neutral-gray-700",
              error
                ? "border-red-500"
                : "border-vaca-neutral-gray-200",
            )}
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="font-inter text-sm font-medium">
              {selectedCountry.code}
            </span>
          </div>

          {/* Phone number input */}
          <input
            ref={ref}
            id={inputId}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="11 1234 5678"
            className={cn(
              "flex-1 rounded-xl border-2 px-4 py-3 font-inter text-base transition-colors duration-200",
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
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            onChange={onChange}
            {...props}
          />
        </div>

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

PhoneInput.displayName = "PhoneInput";
