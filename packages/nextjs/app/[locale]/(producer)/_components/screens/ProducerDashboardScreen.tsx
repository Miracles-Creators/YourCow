"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cn } from "~~/lib/utils/cn";
import { LotRowCard } from "../ui/LotRowCard";
import { ProducerStatCard } from "../ui/ProducerStatCard";
import { StatusPill, type StatusTone } from "../ui/StatusPill";
import { useLots } from "~~/hooks/lots/useLots";
import type { LotDto } from "~~/lib/api/schemas";

type ProducerLot = {
  id: string;
  name: string;
  status: { label: string; tone: StatusTone };
  fundedPercent: number;
  lastUpdate: string;
};

type ProducerAlert = {
  id: string;
  title: string;
  description: string;
  tone: StatusTone;
};

const mockSummary = {
  activeLots: 4,
  totalCapitalRaised: 2850000,
  updatesRequired: 2,
};

const mockAlerts: ProducerAlert[] = [
  {
    id: "alert-1",
    title: "Update due in 2 days",
    description: "Provide the latest lot update for March cycle.",
    tone: "warning",
  },
  {
    id: "alert-2",
    title: "Documents missing",
    description: "Upload vaccination records for Lot San Juan Q1.",
    tone: "warning",
  },
];

const mockLots: ProducerLot[] = [
  {
    id: "lot-001",
    name: "San Juan Feedlot - Q1",
    status: { label: "Funding", tone: "info" },
    fundedPercent: 62,
    lastUpdate: "Feb 14, 2026",
  },
  {
    id: "lot-002",
    name: "La Pampa Steers - Q2",
    status: { label: "Active", tone: "success" },
    fundedPercent: 100,
    lastUpdate: "Feb 09, 2026",
  },
  {
    id: "lot-003",
    name: "Cordoba Cows - Q4",
    status: { label: "Draft", tone: "neutral" },
    fundedPercent: 15,
    lastUpdate: "Jan 28, 2026",
  },
];

const mapLotStatus = (status?: string): { label: string; tone: StatusTone } => {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", tone: "success" };
    case "FUNDING":
      return { label: "Funding", tone: "warning" };
    case "COMPLETED":
      return { label: "Completed", tone: "neutral" };
    case "SETTLING":
      return { label: "Settling", tone: "warning" };
    case "PENDING_DEPLOY":
    case "DRAFT":
    default:
      return { label: "Pending", tone: "info" };
  }
};

export function ProducerDashboardScreen() {
  const { data: apiLots } = useLots();
  const mappedApiLots = useMemo<ProducerLot[]>(() => {
    const formatDate = (value?: string | null) =>
      value ? new Date(value).toLocaleDateString("en-US") : "—";

    return (apiLots ?? []).map((lot: LotDto) => ({
      id: `DB-${lot.id}`,
      name: lot.name,
      status: mapLotStatus(lot.status),
      fundedPercent: lot.fundedPercent ?? 0,
      lastUpdate: formatDate(lot.updatedAt ?? lot.createdAt ?? null),
    }));
  }, [apiLots]);

  const combinedLots = useMemo(
    () => [...mappedApiLots, ...mockLots],
    [mappedApiLots],
  );

  const hasLots = combinedLots.length > 0;
  const hasAlerts = mockAlerts.length > 0;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-playfair text-4xl font-semibold text-vaca-neutral-gray-900">
            Your Lots
          </h1>
          <p className="mt-2 text-sm text-vaca-neutral-gray-500">
            Track approvals, updates, and funding progress in one place.
          </p>
        </div>
        <Link
          href="/producer/lots/new"
          className={cn(
            "btn btn-primary w-full sm:w-auto",
            "border-vaca-green bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-blue focus-visible:ring-offset-2 focus-visible:ring-offset-vaca-neutral-bg",
          )}
        >
          Create New Lot
        </Link>
      </header>

      <section
        aria-labelledby="producer-summary"
        className="grid gap-4 lg:grid-cols-3"
      >
        <h2 id="producer-summary" className="sr-only">
          Lot summary
        </h2>
        <ProducerStatCard
          label="Active lots"
          value={mockSummary.activeLots.toString()}
          helper="Currently in progress"
          variant="primary"
        />
        <ProducerStatCard
          label="Total capital raised"
          value={`$${mockSummary.totalCapitalRaised.toLocaleString()}`}
          helper="Across all active funding"
          variant="info"
        />
        <ProducerStatCard
          label="Updates required"
          value={mockSummary.updatesRequired.toString()}
          helper="Pending producer actions"
          badge={`${mockSummary.updatesRequired}`}
          variant="accent"
        />
      </section>

      {hasAlerts && (
        <section aria-labelledby="producer-attention">
          <div className="mb-4 flex items-center gap-3">
            <h2
              id="producer-attention"
              className="font-playfair text-2xl font-semibold text-vaca-neutral-gray-900"
            >
              Needs your attention
            </h2>
            <StatusPill label={`${mockAlerts.length} open`} tone="warning" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockAlerts.map(alert => (
              <div
                key={alert.id}
                className={cn(
                  "rounded-xl border-l-4 border-vaca-brown bg-vaca-neutral-white p-4 shadow-sm",
                )}
              >
                <p className="text-sm font-semibold text-vaca-brown">
                  {alert.title}
                </p>
                <p className="mt-2 text-sm text-vaca-neutral-gray-500">
                  {alert.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="producer-lots" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            id="producer-lots"
            className="font-playfair text-2xl font-semibold text-vaca-neutral-gray-900"
          >
            My Lots
          </h2>
          <p className="text-sm text-vaca-neutral-gray-500">
            {combinedLots.length} total
          </p>
        </div>

        {hasLots ? (
          <div className="space-y-4">
            {combinedLots.map(lot => (
              <LotRowCard
                key={lot.id}
                name={lot.name}
                statusLabel={lot.status.label}
                statusTone={lot.status.tone}
                fundedPercent={lot.fundedPercent}
                lastUpdate={lot.lastUpdate}
                manageHref={`/producer/lots/${lot.id.replace("DB-", "")}`}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-vaca-neutral-gray-200 bg-vaca-neutral-white p-8 text-center">
            <h3 className="font-playfair text-2xl font-semibold text-vaca-neutral-gray-900">
              No lots yet
            </h3>
            <p className="mt-2 text-sm text-vaca-neutral-gray-500">
              Create your first lot to start the approval workflow.
            </p>
            <Link
              href="/producer/lots/new"
              className={cn(
                "btn btn-primary mt-4",
                "border-vaca-green bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-blue focus-visible:ring-offset-2 focus-visible:ring-offset-vaca-neutral-bg",
              )}
            >
              Create your first lot
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
