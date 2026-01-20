"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "~~/lib/utils/cn";

interface CountrySelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  helperText?: string;
  error?: string;
}

// Common countries for cattle investment platform
const COUNTRIES = [
  { code: "", name: "Select country" },
  { code: "AR", name: "Argentina" },
  { code: "BR", name: "Brazil" },
  { code: "UY", name: "Uruguay" },
  { code: "PY", name: "Paraguay" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "MX", name: "Mexico" },
  { code: "US", name: "United States" },
  { code: "ES", name: "Spain" },
  { code: "OTHER", name: "Other" },
] as const;

/**
 * CountrySelect - Country dropdown for profile forms
 * Pre-populated with relevant LATAM and international markets
 */
export const CountrySelect = forwardRef<HTMLSelectElement, CountrySelectProps>(
  ({ label, helperText, error, className, id, ...props }, ref) => {
    const selectId = id || "country-select";

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-2 block font-inter text-sm font-medium text-vaca-neutral-gray-700"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none rounded-xl border-2 px-4 py-3 pr-10 font-inter text-base transition-colors duration-200",
              "bg-vaca-neutral-white text-vaca-neutral-gray-900",
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
                ? `${selectId}-error`
                : helperText
                  ? `${selectId}-helper`
                  : undefined
            }
            {...props}
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>

          {/* Custom dropdown arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-5 w-5 text-vaca-neutral-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {error ? (
          <p
            id={`${selectId}-error`}
            className="mt-2 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={`${selectId}-helper`}
            className="mt-2 text-sm text-vaca-neutral-gray-500"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

CountrySelect.displayName = "CountrySelect";
