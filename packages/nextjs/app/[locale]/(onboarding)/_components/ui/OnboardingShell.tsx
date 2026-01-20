"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "~~/lib/utils/cn";

interface OnboardingShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * OnboardingShell - Centered card layout wrapper for onboarding screens
 * Provides consistent padding and premium card-based aesthetic
 */
export function OnboardingShell({ children, className }: OnboardingShellProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "w-full rounded-2xl bg-vaca-neutral-white p-6 sm:p-8",
        "shadow-lg shadow-vaca-neutral-gray-200/50",
        "border border-vaca-neutral-gray-100",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

// Animation variants to export for child components
export const shellItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};
