"use client";

import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePortfolioSummary } from "~~/hooks/marketplace";
import { cn } from "~~/lib/utils/cn";
import { PortfolioValueChart } from "../ui/PortfolioValueChart";
import { PositionCard } from "../ui/PositionCard";
import { PrimaryButton } from "../ui/PrimaryButton";
import { slowContainerVariants as containerVariants, slowItemVariants as itemVariants } from "../animations";

export function DashboardScreen() {
  const t = useTranslations("investor.dashboard");
  const { data: summary, isPending } = usePortfolioSummary();

  if (isPending) {
    return <DashboardSkeleton />;
  }

  if (!summary || (summary.activePositions === 0 && summary.settledPositions === 0)) {
    return <EmptyDashboard />;
  }

  const isPositive = summary.totalGain >= 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto w-full pb-8"
    >
      {/* Desktop: Hero + Chart side by side | Mobile: stacked */}
      <div className="lg:grid lg:grid-cols-5 lg:items-start lg:gap-8">
        {/* Portfolio Hero */}
        <motion.div
          variants={itemVariants}
          className="py-3 text-center lg:col-span-2 lg:rounded-2xl lg:border lg:border-vaca-neutral-gray-100 lg:bg-vaca-neutral-white lg:px-6 lg:py-8 lg:text-left"
        >
          <p className="hidden font-inter text-xs font-medium uppercase tracking-widest text-vaca-neutral-gray-400 lg:block">
            {t("stats.currentValue")}
          </p>
          <h1 className="font-playfair text-4xl font-bold tracking-tight text-vaca-neutral-gray-900 lg:mt-2 lg:text-5xl">
            ${summary.currentValue.toLocaleString()}
          </h1>
          <div className="mt-0.5 flex items-center justify-center gap-1 lg:mt-2 lg:justify-start">
            <TrendingUp
              className={cn(
                "h-3 w-3 lg:h-4 lg:w-4",
                isPositive ? "text-vaca-green" : "text-vaca-error",
              )}
            />
            <span
              className={cn(
                "font-inter text-sm font-semibold lg:text-base",
                isPositive ? "text-vaca-green" : "text-vaca-error",
              )}
            >
              {isPositive ? "+" : ""}${Math.abs(summary.totalGain).toLocaleString()} ({isPositive ? "+" : ""}{summary.returnPercent.toFixed(1)}%)
            </span>
          </div>

        </motion.div>

        {/* Chart */}
        <motion.div
          variants={itemVariants}
          className="pt-1 lg:col-span-3 lg:rounded-2xl lg:border lg:border-vaca-neutral-gray-100 lg:bg-vaca-neutral-white lg:p-6 lg:pt-6"
        >
          <h3 className="hidden pb-4 font-playfair text-base font-semibold text-vaca-neutral-gray-900 lg:block">
            {t("chart.title")}
          </h3>
          <div className="lg:h-56">
            <PortfolioValueChart lots={summary.lots} totalValue={summary.currentValue} />
          </div>
        </motion.div>
      </div>

      {/* Mobile-only Summary Grid (2x2) — hidden on desktop (shown inside hero card) */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2.5 py-4 lg:hidden">
        <SummaryCard
          label={t("stats.totalInvested")}
          value={`$${summary.totalInvested.toLocaleString()}`}
        />
        <SummaryCard
          label={t("stats.currentValue")}
          value={`$${summary.currentValue.toLocaleString()}`}
        />
        <SummaryCard
          label={t("stats.activePositions")}
          value={String(summary.activePositions)}
        />
        <SummaryCard
          label={t("stats.settledPositions")}
          value={String(summary.settledPositions)}
        />
      </motion.div>

      {/* Desktop-only: expanded stats row */}
      <motion.div variants={itemVariants} className="hidden py-5 lg:grid lg:grid-cols-4 lg:gap-4">
        <SummaryCard
          label={t("stats.totalInvested")}
          value={`$${summary.totalInvested.toLocaleString()}`}
        />
        <SummaryCard
          label={t("stats.currentValue")}
          value={`$${summary.currentValue.toLocaleString()}`}
        />
        <SummaryCard
          label={t("stats.activePositions")}
          value={String(summary.activePositions)}
        />
        <SummaryCard
          label={t("stats.settledPositions")}
          value={String(summary.settledPositions)}
        />
      </motion.div>

      {/* Your Lots */}
      {summary.lots.length > 0 && (
        <motion.div variants={itemVariants} className="pb-3">
          <h2 className="pb-3 font-playfair text-lg font-bold text-vaca-neutral-gray-900 lg:text-xl">
            {t("performance.title")}
          </h2>
          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:grid-cols-3">
            {summary.lots.slice(0, 3).map((lot) => (
              <PositionCard key={lot.lotId} lot={lot} />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-vaca-neutral-gray-100 bg-vaca-neutral-white px-3.5 py-3 lg:rounded-xl lg:px-5 lg:py-4">
      <p className="font-inter text-[10px] font-medium uppercase tracking-wider text-vaca-neutral-gray-400 lg:text-[11px]">
        {label}
      </p>
      <p className="mt-1 font-inter text-base font-semibold tabular-nums text-vaca-neutral-gray-900 lg:text-lg">
        {value}
      </p>
    </div>
  );
}

function EmptyDashboard() {
  const t = useTranslations("investor.dashboard.empty");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-vaca-gold-light">
        <TrendingUp className="h-10 w-10 text-vaca-gold" />
      </div>
      <h2 className="mb-2 font-playfair text-2xl font-semibold text-vaca-neutral-gray-900">
        {t("title")}
      </h2>
      <p className="mb-8 font-inter text-sm text-vaca-neutral-gray-500">
        {t("description")}
      </p>
      <PrimaryButton href="/marketplace" size="lg">
        {t("cta")}
      </PrimaryButton>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full animate-pulse">
      {/* Desktop: side-by-side hero + chart | Mobile: stacked */}
      <div className="lg:grid lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="mb-3 h-10 w-36 rounded-lg bg-vaca-neutral-gray-100 lg:h-14 lg:w-48" />
          <div className="mb-2 h-4 w-28 rounded bg-vaca-neutral-gray-100" />
        </div>
        <div className="lg:col-span-3">
          <div className="mb-4 h-32 rounded-2xl bg-vaca-neutral-gray-100 lg:h-56" />
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-vaca-neutral-gray-100 lg:h-20" />
        ))}
      </div>
      <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-vaca-neutral-gray-100" />
        ))}
      </div>
    </div>
  );
}
