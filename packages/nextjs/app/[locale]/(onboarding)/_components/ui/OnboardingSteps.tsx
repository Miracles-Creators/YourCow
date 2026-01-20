"use client";

import { cn } from "~~/lib/utils/cn";

interface Step {
  label: string;
  status: "completed" | "active" | "pending";
}

interface OnboardingStepsProps {
  steps: Step[];
  className?: string;
}

/**
 * OnboardingSteps - DaisyUI-inspired steps wrapper
 * Shows progress through multi-step onboarding flows
 */
export function OnboardingSteps({ steps, className }: OnboardingStepsProps) {
  return (
    <ul className={cn("flex w-full justify-center gap-2", className)}>
      {steps.map((step, index) => (
        <li key={step.label} className="flex items-center gap-2">
          {/* Step indicator */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                step.status === "completed" &&
                  "bg-vaca-green text-white",
                step.status === "active" &&
                  "bg-vaca-green/10 text-vaca-green ring-2 ring-vaca-green",
                step.status === "pending" &&
                  "bg-vaca-neutral-gray-100 text-vaca-neutral-gray-400",
              )}
            >
              {step.status === "completed" ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <span
              className={cn(
                "mt-1 text-xs font-medium",
                step.status === "completed" && "text-vaca-green",
                step.status === "active" && "text-vaca-green",
                step.status === "pending" && "text-vaca-neutral-gray-400",
              )}
            >
              {step.label}
            </span>
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-8 sm:w-12",
                step.status === "completed"
                  ? "bg-vaca-green"
                  : "bg-vaca-neutral-gray-200",
              )}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
