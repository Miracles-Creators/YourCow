"use client";

import { cn } from "~~/lib/utils/cn";

export interface FilterChipOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterChipsProps {
  options: FilterChipOption[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

/**
 * FilterChips - Compact filter buttons for list screens.
 */
export function FilterChips({
  options,
  activeId,
  onSelect,
  className,
}: FilterChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isActive = option.id === activeId;
        return (
          <button
            key={option.id}
            type="button"
            onClick={onSelect ? () => onSelect(option.id) : undefined}
            aria-pressed={isActive}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              isActive
                ? "border-vaca-green/40 bg-vaca-green/10 text-vaca-green"
                : "border-vaca-neutral-gray-200 bg-vaca-neutral-white text-vaca-neutral-gray-600 hover:border-vaca-neutral-gray-300",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span className="ml-2 text-[10px] text-vaca-neutral-gray-500">
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
