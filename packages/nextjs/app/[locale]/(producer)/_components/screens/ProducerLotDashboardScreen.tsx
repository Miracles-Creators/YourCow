"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { cn } from "~~/lib/utils/cn";
import { FundingProgress } from "../ui/FundingProgress";
import { StatusPill } from "../ui/StatusPill";

const mockLot = {
  name: "San Juan Feedlot - Q1",
  status: { label: "Active", tone: "success" as const },
  fundedPercent: 82,
  amountRaised: "$2,340,000",
  nextUpdate: "Mar 22, 2026",
  lastUpdate: "Weight update added 3 days ago",
  canRegisterSale: true,
  trustPreview: {
    lastWeight: "285 kg",
    lastHealthCheck: "Feb 12, 2026",
    hasVideo: true,
  },
};

export function ProducerLotDashboardScreen() {
  const prefersReducedMotion = useReducedMotion();
  const params = useParams();
  const lotId = typeof params.lotId === "string" ? params.lotId : "lot-001";
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
      className="space-y-8"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-playfair text-4xl font-semibold text-vaca-neutral-gray-900">
            {mockLot.name}
          </h1>
          <StatusPill label={mockLot.status.label} tone={mockLot.status.tone} />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/producer/lots/${lotId}/updates/new`}
            className={cn(
              "btn btn-primary w-full sm:w-auto",
              "border-vaca-green bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-blue focus-visible:ring-offset-2 focus-visible:ring-offset-vaca-neutral-bg",
            )}
          >
            Add Update
          </Link>
          <Link
            href={`/producer/lots/${lotId}/timeline`}
            className={cn(
              "btn btn-outline w-full sm:w-auto",
              "border-vaca-blue text-vaca-blue hover:bg-vaca-blue/10",
            )}
          >
            View Timeline
          </Link>
          {mockLot.canRegisterSale && (
            <Link
              href={`/producer/lots/${lotId}/sale`}
              className={cn(
                "btn btn-outline w-full sm:w-auto",
                "border-vaca-brown text-vaca-brown hover:bg-vaca-brown/10",
              )}
            >
              Register Sale
            </Link>
          )}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-vaca-neutral-gray-700">
            Funding progress
          </h2>
          <p className="mt-2 text-2xl font-semibold text-vaca-green">
            {mockLot.amountRaised}
          </p>
          <FundingProgress value={mockLot.fundedPercent} className="mt-4" />
        </div>
        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-vaca-neutral-gray-700">
            Next required update
          </h2>
          <p className="mt-3 font-playfair text-2xl text-vaca-blue">
            {mockLot.nextUpdate}
          </p>
          <p className="mt-1 text-xs text-vaca-neutral-gray-500">
            Please submit by end of day.
          </p>
        </div>
        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-vaca-neutral-gray-700">
            Last update
          </h2>
          <p className="mt-3 text-sm text-vaca-neutral-gray-600">
            {mockLot.lastUpdate}
          </p>
        </div>
      </section>

      <section className="rounded-xl border-l-4 border-vaca-brown bg-vaca-neutral-white p-5">
        <h2 className="text-sm font-semibold text-vaca-brown">
          This is what investors see
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-vaca-neutral-gray-600">
          <li>Last weight update: {mockLot.trustPreview.lastWeight}</li>
          <li>Last health check: {mockLot.trustPreview.lastHealthCheck}</li>
          <li>
            Producer video:{" "}
            {mockLot.trustPreview.hasVideo ? "Available" : "Not added"}
          </li>
        </ul>
      </section>
    </motion.div>
  );
}
