"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~~/components/ui";
import { useCreateAuditBatch } from "~~/hooks/audit/useCreateAuditBatch";
import { useVerifyLatestAuditBatch } from "~~/hooks/audit/useVerifyLatestAuditBatch";
import { AdminPageHeader, KpiCard, QueueCard } from "../index";

const kpis = [
  {
    label: "Producers pending",
    value: "18",
    delta: "6 awaiting documents",
    tone: "info" as const,
  },
  {
    label: "Lots pending approval",
    value: "7",
    delta: "2 high priority",
    tone: "warning" as const,
  },
  {
    label: "Flagged updates",
    value: "4",
    delta: "1 critical",
    tone: "danger" as const,
  },
];

const queueItems = [
  {
    title: "Lot #102 missing documents",
    description: "Health certificate and weight report required.",
    statusLabel: "Pending",
    statusTone: "pending" as const,
    href: "/admin/lots/102",
  },
  {
    title: "Producer verification pending: Martinez Farm",
    description: "Awaiting onsite verification approval.",
    statusLabel: "Review",
    statusTone: "info" as const,
    href: "/admin/producers/23",
  },
  {
    title: "Update flagged: Weight anomaly",
    description: "Unusual delta in weekly weigh-in.",
    statusLabel: "Flagged",
    statusTone: "flagged" as const,
    href: "/admin/updates/55",
  },
];

const quickNav = [
  { label: "Producers", href: "/admin/producers", tone: "border-vaca-blue/30" },
  { label: "Lots", href: "/admin/lots", tone: "border-vaca-brown/30" },
  { label: "Updates", href: "/admin/updates", tone: "border-vaca-green/30" },
  {
    label: "Settlements",
    href: "/admin/settlements",
    tone: "border-vaca-neutral-gray-200",
  },
];

const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
  },
};

/**
 * AdminDashboardScreen (ADMIN-02)
 * Ops dashboard for approvals, queues, and quick navigation.
 */
export function AdminDashboardScreen() {
  const createAuditBatch = useCreateAuditBatch();
  const verifyLatestBatch = useVerifyLatestAuditBatch();
  const [auditMessage, setAuditMessage] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isAnchorModalOpen, setIsAnchorModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAnchorModalOpen) return;
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>("button");
    firstFocusable?.focus();
  }, [isAnchorModalOpen]);

  const handleModalKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      setIsAnchorModalOpen(false);
    }

    if (event.key === "Tab" && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>("button");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const handleAnchorBatch = async () => {
    setAuditMessage(null);
    setAuditError(null);
    try {
      const batch = await createAuditBatch.mutateAsync();
      setAuditMessage(
        `Batch #${batch.id} anchored (${batch.fromLedgerId}-${batch.toLedgerId}).`,
      );
      setVerifyMessage(null);
      setIsAnchorModalOpen(false);
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : "Failed to anchor batch.");
    }
  };

  const handleVerifyLatest = async () => {
    setVerifyMessage(null);
    setVerifyError(null);
    try {
      const result = await verifyLatestBatch.mutateAsync();
      const matches =
        result.matches.dbComputed &&
        result.matches.dbOnchain &&
        result.matches.computedOnchain &&
        result.rangesMatch;

      if (matches) {
        setVerifyMessage(`Batch #${result.batchId} verified on-chain.`);
      } else {
        setVerifyError(`Mismatch detected for batch #${result.batchId}.`);
      }
    } catch (error) {
      setVerifyError(error instanceof Error ? error.message : "Failed to verify batch.");
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <AdminPageHeader
        title="Admin Dashboard"
        subtitle="Operational overview for approvals, flags, and settlements."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            delta={kpi.delta}
            tone={kpi.tone}
          />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-vaca-neutral-gray-900">
              Needs attention
            </h2>
            <Link
              href="/admin/queues"
              className="text-xs font-semibold text-vaca-blue hover:text-vaca-blue-dark"
            >
              View all queues
            </Link>
          </div>
          <div className="space-y-3">
            {queueItems.map((item) => (
              <QueueCard key={item.title} {...item} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-vaca-neutral-gray-900">
            Quick navigation
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-xl border bg-vaca-neutral-white p-4 text-sm font-semibold text-vaca-neutral-gray-800 shadow-sm transition hover:border-vaca-neutral-gray-300 ${item.tone}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <Card variant="bordered" className="space-y-3">
            <CardHeader className="mb-0">
              <CardTitle size="sm">Ledger audit</CardTitle>
              <CardDescription>
                Manually anchor the latest ledger batch on-chain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {auditMessage ? (
                <p className="text-xs font-semibold text-vaca-green">
                  {auditMessage}
                </p>
              ) : null}
              {auditError ? (
                <p className="text-xs font-semibold text-red-600">
                  {auditError}
                </p>
              ) : null}
              {verifyMessage ? (
                <p className="text-xs font-semibold text-vaca-green">
                  {verifyMessage}
                </p>
              ) : null}
              {verifyError ? (
                <p className="text-xs font-semibold text-red-600">
                  {verifyError}
                </p>
              ) : null}
            </CardContent>
            <CardFooter className="mt-0 border-t-0 pt-0 flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                colorScheme="blue"
                size="sm"
                onClick={() => {
                  setAuditError(null);
                  setIsAnchorModalOpen(true);
                }}
                disabled={createAuditBatch.isPending}
              >
                Anchor batch
              </Button>
              <Button
                type="button"
                variant="outline"
                colorScheme="blue"
                size="sm"
                onClick={handleVerifyLatest}
                disabled={verifyLatestBatch.isPending}
              >
                {verifyLatestBatch.isPending ? "Verifying..." : "Verify latest"}
              </Button>
            </CardFooter>
          </Card>

          <div className="rounded-xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-vaca-neutral-gray-500">
              Loading preview
            </p>
            <div className="mt-3 space-y-2" aria-hidden="true">
              <div className="h-3 w-2/3 rounded-full bg-vaca-neutral-gray-100 animate-pulse" />
              <div className="h-3 w-1/2 rounded-full bg-vaca-neutral-gray-100 animate-pulse" />
              <div className="h-3 w-3/4 rounded-full bg-vaca-neutral-gray-100 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {isAnchorModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm ledger anchor"
          onKeyDown={handleModalKeyDown}
        >
          <div
            ref={modalRef}
            className="w-full max-w-md rounded-2xl bg-vaca-neutral-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-vaca-neutral-gray-900">
              Confirm ledger anchor
            </h3>
            <p className="mt-2 text-sm text-vaca-neutral-gray-500">
              This will anchor the latest ledger batch on-chain and register it for audit.
            </p>

            {auditError ? (
              <p className="mt-3 text-xs text-red-600">{auditError}</p>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAnchorModalOpen(false)}
                className="rounded-full border border-vaca-neutral-gray-200 px-4 py-2 text-xs font-semibold text-vaca-neutral-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAnchorBatch}
                disabled={createAuditBatch.isPending}
                className="rounded-full bg-vaca-blue px-4 py-2 text-xs font-semibold text-vaca-neutral-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {createAuditBatch.isPending ? "Anchoring..." : "Anchor batch"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
