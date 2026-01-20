"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "~~/lib/utils/cn";

interface SelectableRoleCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  accent: "green" | "blue";
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * SelectableRoleCard - Role choice card for Investor/Producer selection
 * Features prominent icon, title, description with selection state
 */
export function SelectableRoleCard({
  title,
  description,
  icon,
  accent,
  isSelected,
  onSelect,
}: SelectableRoleCardProps) {
  const accentColors = {
    green: {
      ring: "ring-vaca-green",
      bg: "bg-vaca-green/5",
      iconBg: "bg-vaca-green/10",
      iconText: "text-vaca-green",
      border: "border-vaca-green/20",
    },
    blue: {
      ring: "ring-vaca-blue",
      bg: "bg-vaca-blue/5",
      iconBg: "bg-vaca-blue/10",
      iconText: "text-vaca-blue-dark",
      border: "border-vaca-blue/20",
    },
  };

  const colors = accentColors[accent];

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full rounded-xl border-2 p-5 text-left transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        colors.ring.replace("ring-", "focus-visible:ring-"),
        isSelected
          ? cn("ring-2", colors.ring, colors.bg, colors.border)
          : "border-vaca-neutral-gray-200 bg-vaca-neutral-white hover:border-vaca-neutral-gray-300",
      )}
      aria-pressed={isSelected}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            isSelected ? colors.iconBg : "bg-vaca-neutral-gray-100",
          )}
        >
          <div
            className={cn(
              "h-6 w-6",
              isSelected ? colors.iconText : "text-vaca-neutral-gray-500",
            )}
          >
            {icon}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3
            className={cn(
              "font-inter text-base font-semibold",
              isSelected ? "text-vaca-neutral-gray-900" : "text-vaca-neutral-gray-700",
            )}
          >
            {title}
          </h3>
          <p className="mt-1 font-inter text-sm text-vaca-neutral-gray-500">
            {description}
          </p>
        </div>

        {/* Selection indicator */}
        <div
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            isSelected
              ? cn(colors.ring.replace("ring-", "border-"), colors.ring.replace("ring-", "bg-"))
              : "border-vaca-neutral-gray-300 bg-transparent",
          )}
        >
          {isSelected && (
            <svg
              className="h-3 w-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={4}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
    </motion.button>
  );
}
