"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";
import { cn } from "~~/lib/utils/cn";

export function SaleSubmittedScreen() {
  const prefersReducedMotion = useReducedMotion();
  const transition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    [prefersReducedMotion],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className="space-y-4"
    >
      <h1 className="font-playfair text-4xl font-semibold text-vaca-neutral-gray-900">
        Sale event submitted
      </h1>
      <p className="text-sm text-vaca-neutral-gray-500">
        Settlement processing has started. We will update you once reviews are
        complete.
      </p>
      <Link
        href="/producer"
        className={cn(
          "btn btn-primary w-full sm:w-auto",
          "border-vaca-green bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark",
        )}
      >
        Back to dashboard
      </Link>
    </motion.div>
  );
}
