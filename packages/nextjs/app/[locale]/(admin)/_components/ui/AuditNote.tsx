"use client";

import { useEffect, useState } from "react";
import { cn } from "~~/lib/utils/cn";

interface AuditNoteProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  actionLabel?: string;
  className?: string;
}

/**
 * AuditNote - Internal note box for admin reviews.
 */
export function AuditNote({
  value,
  placeholder = "Add internal notes for this review...",
  onChange,
  onSave,
  actionLabel = "Save note",
  className,
}: AuditNoteProps) {
  const [note, setNote] = useState(value ?? "");

  useEffect(() => {
    if (typeof value === "string") {
      setNote(value);
    }
  }, [value]);

  return (
    <div className={cn("rounded-xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-4", className)}>
      <label className="text-sm font-semibold text-vaca-neutral-gray-800">
        Internal notes
      </label>
      <textarea
        value={note}
        onChange={(event) => {
          setNote(event.target.value);
          onChange?.(event.target.value);
        }}
        placeholder={placeholder}
        rows={5}
        className="mt-3 w-full resize-none rounded-lg border border-vaca-neutral-gray-200 bg-vaca-neutral-white px-3 py-2 text-sm text-vaca-neutral-gray-800 focus:border-vaca-green focus:outline-none focus:ring-2 focus:ring-vaca-green/20"
      />
      <div className="mt-3 flex items-center justify-end">
        <button
          type="button"
          onClick={() => onSave?.(note)}
          className="rounded-full bg-vaca-green px-4 py-2 text-xs font-semibold text-vaca-neutral-white shadow-sm transition hover:bg-vaca-green-dark"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
