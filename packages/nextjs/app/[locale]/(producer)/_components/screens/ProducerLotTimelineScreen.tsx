"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "~~/lib/utils/cn";
import { StatusPill } from "../ui/StatusPill";

type TimelineFilter = "all" | "weight" | "health" | "feeding";

type TimelineItem = {
  id: string;
  date: string;
  type: "weight" | "health" | "feeding";
  summary: string;
  status: "Pending" | "Verified";
};

const timelineItems: TimelineItem[] = [
  {
    id: "update-01",
    date: "Mar 12, 2026",
    type: "weight",
    summary: "Average weight updated to 285 kg",
    status: "Verified",
  },
  {
    id: "update-02",
    date: "Mar 01, 2026",
    type: "health",
    summary: "Routine health check completed",
    status: "Pending",
  },
  {
    id: "update-03",
    date: "Feb 20, 2026",
    type: "feeding",
    summary: "Adjusted feed mix for higher energy intake",
    status: "Verified",
  },
];

const filterOptions: { label: string; value: TimelineFilter }[] = [
  { label: "All", value: "all" },
  { label: "Weight", value: "weight" },
  { label: "Health", value: "health" },
  { label: "Feeding", value: "feeding" },
];

const typeLabels: Record<TimelineItem["type"], string> = {
  weight: "Weight",
  health: "Health",
  feeding: "Feeding",
};

export function ProducerLotTimelineScreen() {
  const prefersReducedMotion = useReducedMotion();
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const params = useParams();
  const lotId = typeof params.lotId === "string" ? params.lotId : "lot-001";

  const transition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    [prefersReducedMotion],
  );

  const filteredItems =
    filter === "all"
      ? timelineItems
      : timelineItems.filter(item => item.type === filter);

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className="space-y-6"
    >
      <header className="space-y-2">
        <h1 className="font-playfair text-4xl font-semibold text-vaca-neutral-gray-900">
          Lot timeline
        </h1>
        <p className="text-sm text-vaca-neutral-gray-500">
          Review production updates shared with investors.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={cn(
              "btn btn-sm rounded-full border",
              filter === option.value
                ? "border-vaca-green bg-vaca-green/10 text-vaca-green"
                : "border-vaca-neutral-gray-200 text-vaca-neutral-gray-600",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-vaca-neutral-gray-200 bg-vaca-neutral-white p-8 text-center">
          <h2 className="font-playfair text-2xl font-semibold text-vaca-neutral-gray-900">
            No updates yet
          </h2>
          <p className="mt-2 text-sm text-vaca-neutral-gray-500">
            Add your first update to keep investors informed.
          </p>
          <Link
            href={`/producer/lots/${lotId}/updates/new`}
            className={cn(
              "btn btn-primary mt-4",
              "border-vaca-green bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark",
            )}
          >
            Add update
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-vaca-brown/10 text-vaca-brown">
                  <span className="text-xs font-semibold">
                    {typeLabels[item.type]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-vaca-neutral-gray-800">
                    {item.summary}
                  </p>
                  <p className="mt-1 text-xs text-vaca-neutral-gray-500">
                    {item.date}
                  </p>
                </div>
              </div>
              <StatusPill
                label={item.status}
                tone={item.status === "Verified" ? "success" : "info"}
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
