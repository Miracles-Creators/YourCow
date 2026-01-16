"use client";

import { motion } from "framer-motion";
import Link from "next/link";
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
  {
    label: "Open liquidity windows",
    value: "3",
    delta: "Next closes in 8 days",
    tone: "success" as const,
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
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <AdminPageHeader
        title="Admin Dashboard"
        subtitle="Operational overview for approvals, flags, and liquidity events."
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
    </motion.div>
  );
}
