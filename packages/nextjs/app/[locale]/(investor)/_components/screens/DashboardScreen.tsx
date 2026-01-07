"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { PrimaryButton } from "../ui/PrimaryButton";
import { StatCard } from "../ui/StatCard";

// TODO: Replace with real API data
const mockData = {
  totalInvested: 125000,
  currentValue: 132450,
  gain: 7450,
  gainPercentage: 5.96,
  status: "Production ongoing",
  nextLiquidityWindow: {
    date: "March 15, 2026",
    daysRemaining: 72,
  },
};

/**
 * DashboardScreen (INV-07)
 * Home dashboard for investor portfolio overview
 */
export function DashboardScreen() {
  const t = useTranslations("investor.dashboard");

  // Staggered animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-4xl"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="mb-12">
        <h1 className="font-playfair text-4xl font-bold tracking-tight text-vaca-neutral-gray-900 sm:text-5xl">
          {t("title")}
        </h1>
      </motion.div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        {/* Total Invested */}
        <motion.div variants={itemVariants}>
          <StatCard
            label={t("stats.totalInvested")}
            value={`$${mockData.totalInvested.toLocaleString()}`}
            variant="primary"
          />
        </motion.div>

        {/* Current Value */}
        <motion.div variants={itemVariants}>
          <StatCard
            label={t("stats.currentValue")}
            value={`$${mockData.currentValue.toLocaleString()}`}
            sublabel={`+$${mockData.gain.toLocaleString()} (+${mockData.gainPercentage}%)`}
            variant="secondary"
          />
        </motion.div>
      </div>

      {/* Status Badge */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-lg bg-vaca-green/10 px-4 py-2.5">
          <div className="h-2 w-2 rounded-full bg-vaca-green animate-pulse" />
          <span className="font-inter text-sm font-medium text-vaca-green">
            {t("status.productionOngoing")}
          </span>
        </div>
      </motion.div>

      {/* Next Liquidity Window Card */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="rounded-xl border-l-4 border-vaca-blue bg-vaca-neutral-white p-6 shadow-md">
          <h3 className="mb-2 font-inter text-sm font-medium uppercase tracking-wide text-vaca-neutral-gray-500">
            {t("nextLiquidityWindow.title")}
          </h3>
          <p className="mb-1 font-playfair text-2xl font-semibold text-vaca-blue">
            {mockData.nextLiquidityWindow.date}
          </p>
          <p className="font-inter text-sm text-vaca-neutral-gray-500">
            {t("nextLiquidityWindow.daysRemaining", {
              count: mockData.nextLiquidityWindow.daysRemaining,
            })}
          </p>
        </div>
      </motion.div>

      {/* Primary CTA */}
      <motion.div variants={itemVariants}>
        <PrimaryButton
          href="/marketplace"
          size="lg"
          className="w-full sm:w-auto"
        >
          {t("cta")}
        </PrimaryButton>
      </motion.div>
    </motion.div>
  );
}
