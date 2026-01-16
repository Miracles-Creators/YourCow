"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Card } from "~~/components/ui";
import { cn } from "~~/lib/utils/cn";

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  variant?: "primary" | "secondary";
  icon?: ReactNode;
  className?: string;
}

/**
 * StatCard - Display large metrics with labels
 * Composes the shared Card component with investor branding.
 * Used in Dashboard for portfolio metrics.
 */
export function StatCard({
  label,
  value,
  sublabel,
  variant = "primary",
  icon,
  className,
}: StatCardProps) {
  const accentMap = {
    primary: "green" as const,
    secondary: "blue" as const,
  };

  const valueColorMap = {
    primary: "text-vaca-green",
    secondary: "text-vaca-blue",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }}
    >
      <Card
        variant="elevated"
        accent={accentMap[variant]}
        padding="lg"
        className={className}
      >
        {/* Icon (optional) */}
        {icon && (
          <div className="mb-4 flex items-center justify-between">
            <div className="text-vaca-neutral-gray-400">{icon}</div>
          </div>
        )}

        {/* Label */}
        <p className="mb-2 font-inter text-sm font-medium uppercase tracking-wide text-vaca-neutral-gray-500">
          {label}
        </p>

        {/* Value */}
        <h3
          className={cn(
            "mb-1 font-playfair text-4xl font-semibold leading-tight tracking-tight sm:text-5xl",
            valueColorMap[variant],
          )}
        >
          {value}
        </h3>

        {/* Sublabel (optional) */}
        {sublabel && (
          <p className="font-inter text-sm text-vaca-neutral-gray-400">
            {sublabel}
          </p>
        )}
      </Card>
    </motion.div>
  );
}
