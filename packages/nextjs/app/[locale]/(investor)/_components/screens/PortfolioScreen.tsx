"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { mockPositions, type Position } from "../../_constants/mockData";
import { useMe } from "~~/hooks/auth/useMe";
import { cn } from "~~/lib/utils/cn";

/**
 * PortfolioScreen (INV-13)
 * Portfolio overview showing all active investments
 *
 * Shows:
 * - List of active investments
 * - Each row: lot name, invested amount, current NAV, status badge
 *
 * Style: Green accents, clean list
 */
export function PortfolioScreen() {
  const t = useTranslations("investor.portfolio");

  useMe();

  // Calculate portfolio totals
  const totalInvested = mockPositions.reduce(
    (sum, pos) => sum + pos.investmentAmount,
    0,
  );
  const totalCurrentValue = mockPositions.reduce(
    (sum, pos) => sum + pos.currentNAV,
    0,
  );
  const totalGain = totalCurrentValue - totalInvested;
  const totalGainPercentage = (totalGain / totalInvested) * 100;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <h1 className="mb-2 font-playfair text-3xl font-semibold tracking-tight text-vaca-neutral-gray-900">
          {t("title")}
        </h1>
        <p className="font-inter text-sm text-vaca-neutral-gray-500">
          {t("subtitle")}
        </p>
      </motion.div>

      {/* Portfolio Summary Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <SummaryCard
          label={t("summary.totalInvested")}
          value={`$${totalInvested.toLocaleString("en-US")}`}
          variant="neutral"
        />
        <SummaryCard
          label={t("summary.currentValue")}
          value={`$${totalCurrentValue.toLocaleString("en-US")}`}
          variant="primary"
        />
        <SummaryCard
          label={t("summary.totalGain")}
          value={`$${totalGain.toLocaleString("en-US", { signDisplay: "always" })}`}
          variant={totalGain >= 0 ? "success" : "danger"}
        />
        <SummaryCard
          label={t("summary.return")}
          value={`${totalGainPercentage >= 0 ? "+" : ""}${totalGainPercentage.toFixed(2)}%`}
          variant={totalGainPercentage >= 0 ? "success" : "danger"}
        />
      </motion.div>

      {/* Positions List */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h2 className="font-inter text-xs font-semibold uppercase tracking-wide text-vaca-neutral-gray-500">
          {t("positions.title", { count: mockPositions.length })}
        </h2>

        <div className="space-y-2">
          {mockPositions.map((position, index) => (
            <PositionCard key={position.id} position={position} index={index} />
          ))}
        </div>
      </motion.div>

      {/* Empty State (when no positions) */}
      {mockPositions.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border-2 border-dashed border-vaca-neutral-gray-200 bg-vaca-neutral-gray-50 py-16 text-center"
        >
          <svg
            className="mx-auto mb-4 h-12 w-12 text-vaca-neutral-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
          <h3 className="mb-2 font-playfair text-lg font-semibold text-vaca-neutral-gray-900">
            {t("emptyState.title")}
          </h3>
          <p className="mb-6 font-inter text-sm text-vaca-neutral-gray-600">
            {t("emptyState.description")}
          </p>
          <Link
            href="/marketplace"
            className={cn(
              "inline-flex rounded-xl bg-vaca-green px-6 py-3",
              "font-inter text-sm font-semibold text-vaca-neutral-white",
              "transition-all duration-200 hover:bg-vaca-green-dark",
            )}
          >
            {t("emptyState.cta")}
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * SummaryCard Component
 * Small stat card for portfolio summary
 */
interface SummaryCardProps {
  label: string;
  value: string;
  variant?: "neutral" | "primary" | "success" | "danger";
}

function SummaryCard({ label, value, variant = "neutral" }: SummaryCardProps) {
  const variantStyles = {
    neutral: "bg-vaca-neutral-gray-50 text-vaca-neutral-gray-900",
    primary: "bg-vaca-green/5 text-vaca-green",
    success: "bg-vaca-green/5 text-vaca-green",
    danger: "bg-red-50 text-red-700",
  };

  return (
    <div className="rounded-xl bg-vaca-neutral-white p-4 shadow-sm ring-1 ring-vaca-neutral-gray-200">
      <div className="mb-1 font-inter text-xs text-vaca-neutral-gray-500">
        {label}
      </div>
      <div
        className={cn(
          "font-playfair text-lg font-semibold tabular-nums sm:text-xl",
          variantStyles[variant],
        )}
      >
        {value}
      </div>
    </div>
  );
}

/**
 * PositionCard Component
 * Individual position row with details
 */
interface PositionCardProps {
  position: Position;
  index: number;
}

function PositionCard({ position, index }: PositionCardProps) {
  const t = useTranslations("investor.portfolio");
  const tCommon = useTranslations("common");

  const gain = position.currentNAV - position.investmentAmount;
  const gainPercentage = (gain / position.investmentAmount) * 100;

  const statusConfig = {
    active: {
      label: t("status.active"),
      color: "bg-vaca-green/10 text-vaca-green border-vaca-green/20",
    },
    liquidated: {
      label: t("status.liquidated"),
      color:
        "bg-vaca-neutral-gray-100 text-vaca-neutral-gray-700 border-vaca-neutral-gray-200",
    },
    pending_sale: {
      label: t("status.pendingSale"),
      color: "bg-vaca-blue/10 text-vaca-blue border-vaca-blue/20",
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <motion.div variants={itemVariants}>
      <Link
        href={`/position/${position.id}`}
        className={cn(
          "block rounded-xl border-2 border-vaca-neutral-gray-200 bg-vaca-neutral-white",
          "p-4 transition-all duration-200",
          "hover:border-vaca-green/30 hover:shadow-md",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: Lot Info */}
          <div className="flex-1 min-w-0">
            <h3 className="mb-1 font-playfair text-base font-semibold text-vaca-neutral-gray-900 truncate">
              {position.lot.name}
            </h3>
            <p className="mb-2 font-inter text-xs text-vaca-neutral-gray-500">
              {position.lot.location}
            </p>

            {/* Status Badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1",
                "font-inter text-xs font-medium",
                statusConfig[position.status].color,
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
              {statusConfig[position.status].label}
            </span>
          </div>

          {/* Right: Financials */}
          <div className="text-right flex-shrink-0">
            <div className="mb-1 font-inter text-xs text-vaca-neutral-gray-500">
              {t("positions.currentValue")}
            </div>
            <div className="mb-2 font-playfair text-lg font-semibold text-vaca-neutral-gray-900">
              ${position.currentNAV.toLocaleString("en-US")}
            </div>
            <div
              className={cn(
                "font-inter text-xs font-medium",
                gain >= 0 ? "text-vaca-green" : "text-red-600",
              )}
            >
              {gain >= 0 ? "+" : ""}${gain.toLocaleString("en-US")} (
              {gainPercentage >= 0 ? "+" : ""}
              {gainPercentage.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Bottom: Investment Details */}
        <div className="mt-3 flex items-center gap-4 border-t border-vaca-neutral-gray-100 pt-3 text-xs text-vaca-neutral-gray-600">
          <div>
            <span className="font-medium">{t("positions.invested")}:</span> $
            {position.investmentAmount.toLocaleString("en-US")}
          </div>
          <div>
            <span className="font-medium">{t("positions.shares")}:</span>{" "}
            {position.shares.toLocaleString("en-US")}
          </div>
          <div className="ml-auto">
            <span className="font-medium">{tCommon("time.since")}:</span>{" "}
            {new Date(position.investmentDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
