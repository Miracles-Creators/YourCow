"use client";

import { motion } from "framer-motion";

export type SegmentedToggleVariant = "pill" | "underline";

export interface SegmentedToggleOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedToggleProps<T extends string> {
  options: SegmentedToggleOption<T>[];
  activeValue: T;
  onChange: (value: T) => void;
  variant?: SegmentedToggleVariant;
  layoutId: string;
}

export function SegmentedToggle<T extends string>({
  options,
  activeValue,
  onChange,
  variant = "pill",
  layoutId,
}: SegmentedToggleProps<T>) {
  if (variant === "underline") {
    return (
      <div className="flex border-b border-vaca-neutral-gray-100">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`relative flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeValue === option.value
                ? "text-vaca-neutral-gray-900"
                : "text-vaca-neutral-gray-400 hover:text-vaca-neutral-gray-600"
            }`}
          >
            {option.label}
            {activeValue === option.value && (
              <motion.div
                layoutId={layoutId}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-vaca-green"
                transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1 rounded-xl bg-vaca-neutral-gray-50 p-[3px]">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className="relative flex-1 rounded-[10px] px-4 py-2.5 text-sm font-medium transition-colors"
        >
          {activeValue === option.value && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 rounded-[10px] bg-white shadow-sm"
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            />
          )}
          <span
            className={`relative z-10 flex items-center justify-center gap-1.5 ${
              activeValue === option.value
                ? "font-semibold text-vaca-neutral-gray-900"
                : "text-vaca-neutral-gray-400"
            }`}
          >
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}
