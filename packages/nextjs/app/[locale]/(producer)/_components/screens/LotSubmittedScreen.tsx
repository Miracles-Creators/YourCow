"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";
import { cn } from "~~/lib/utils/cn";

const steps = [
  "We review your documents",
  "We verify lot parameters",
  "Your lot goes live for investors",
];

export function LotSubmittedScreen() {
  const prefersReducedMotion = useReducedMotion();
  const transition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.45, ease: [0.4, 0, 0.2, 1] as const },
    [prefersReducedMotion],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className="space-y-6"
    >
      <header className="space-y-2">
        <h1 className="font-playfair text-4xl font-semibold text-vaca-neutral-gray-900">
          Submitted for approval
        </h1>
        <p className="text-sm text-vaca-neutral-gray-500">
          We received your lot submission. Here is what happens next.
        </p>
      </header>

      <div className="rounded-2xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-6 shadow-sm">
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
                  "border-vaca-green bg-vaca-green/10 text-vaca-green",
                )}
              >
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-vaca-neutral-gray-800">
                  {step}
                </p>
                {index === 0 && (
                  <p className="mt-1 text-xs text-vaca-neutral-gray-500">
                    Typical reviews take a short period, depending on document
                    completeness.
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl border-l-4 border-vaca-blue bg-vaca-neutral-white p-4 text-sm text-vaca-neutral-gray-600">
        Estimated review time is shared as guidance only and may vary based on
        verification needs.
      </div>

      <Link
        href="/producer"
        className={cn(
          "btn btn-primary w-full sm:w-auto",
          "border-vaca-green bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-blue focus-visible:ring-offset-2 focus-visible:ring-offset-vaca-neutral-bg",
        )}
      >
        Back to dashboard
      </Link>
    </motion.div>
  );
}
