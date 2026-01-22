"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Filter } from "lucide-react";
import { type LotCategory } from "../../_constants/mockData";
import { InvestmentCard } from "../ui/InvestmentCard";
import { cn } from "~~/lib/utils/cn";
import { useLots } from "~~/hooks/lots/useLots";
import type { LotDto } from "~~/lib/api/schemas";

/**
 * MarketplaceScreen (INV-08)
 * Browse available cattle investment lots with filtering
 */
export function MarketplaceScreen() {
  const t = useTranslations("investor.marketplace");
  const tCommon = useTranslations("common");
  const fallbackText = "sin back-end";

  const [selectedFilter, setSelectedFilter] = useState<LotCategory | "all">(
    "all",
  );

  const { data: lotsData, isPending } = useLots();
  const lots = lotsData ?? [];

  // Staggered animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  const mapCategory = (productionType: string): LotCategory => {
    switch (productionType) {
      case "FEEDLOT":
      case "MIXED":
        return "Fattening";
      case "PASTURE":
        return "Breeding";
      default:
        return "Fattening";
    }
  };

  const toCardProps = (lot: LotDto) => {
    const metadata =
      lot.metadata && typeof lot.metadata === "object"
        ? (lot.metadata as Record<string, unknown>)
        : {};
    const expectedReturn =
      typeof metadata.expectedReturn === "string"
        ? metadata.expectedReturn
        : `${lot.investorPercent}%`;
    const pricePerShare = Number(lot.pricePerShare);
    const sharesAvailable =
      typeof metadata.sharesAvailable === "number"
        ? metadata.sharesAvailable
        : fallbackText;

    return {
      lotId: lot.id,
      name: lot.name || fallbackText,
      location: lot.location || fallbackText,
      duration: lot.durationWeeks
        ? `${lot.durationWeeks} weeks`
        : fallbackText,
      expectedReturn: expectedReturn || fallbackText,
      fundingProgress:
        typeof lot.fundedPercent === "number"
          ? lot.fundedPercent
          : fallbackText,
      herdSize: lot.cattleCount ?? fallbackText,
      category: mapCategory(lot.productionType),
      pricePerShare: Number.isFinite(pricePerShare)
        ? pricePerShare
        : fallbackText,
      sharesAvailable,
    };
  };

  // Filter lots based on selected category
  const filteredLots =
    selectedFilter === "all"
      ? lots
      : lots.filter((lot) => {
          const category = mapCategory(lot.productionType);
          return category === selectedFilter;
        });

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center font-inter text-sm text-vaca-neutral-gray-500">
          {tCommon("loading.default")}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="mb-3 font-playfair text-3xl font-bold tracking-tight text-vaca-green sm:text-4xl">
          {t("title")}
        </h1>
        <p className="font-inter text-lg text-vaca-neutral-gray-600">
          {t("subtitle")}
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-vaca-neutral-gray-500">
            <Filter className="h-4 w-4" />
            <span className="font-inter text-sm">{t("filters.label")}</span>
          </div>
          {[
            { key: "all" as const, label: t("filters.all") },
            { key: "Breeding" as const, label: t("filters.breeding") },
            { key: "Fattening" as const, label: t("filters.fattening") },
            { key: "Dairy" as const, label: t("filters.dairy") },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedFilter(key)}
              className={cn(
                "rounded-xl px-4 py-2 font-inter text-sm font-medium transition-all",
                selectedFilter === key
                  ? "bg-vaca-green text-vaca-neutral-white shadow-md"
                  : "border border-vaca-neutral-gray-200 bg-vaca-neutral-white text-vaca-neutral-gray-600 hover:bg-vaca-neutral-gray-50",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Lots Grid */}
      {filteredLots.length > 0 ? (
        <motion.div
          key={selectedFilter}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredLots.map((lot) => (
            <motion.div key={lot.id} variants={cardVariants}>
              <InvestmentCard {...toCardProps(lot)} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        // Empty State
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-vaca-neutral-gray-200 bg-vaca-neutral-gray-50 p-12 text-center"
        >
          <svg
            className="mb-4 h-16 w-16 text-vaca-neutral-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mb-2 font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
            {t("emptyState.title")}
          </h3>
          <p className="font-inter text-sm text-vaca-neutral-gray-500">
            {t("emptyState.description")}
          </p>
        </motion.div>
      )}
    </div>
  );
}
