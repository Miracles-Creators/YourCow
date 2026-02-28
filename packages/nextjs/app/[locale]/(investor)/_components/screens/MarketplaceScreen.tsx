"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Filter } from "lucide-react";
import { useTranslations } from "next-intl";

import { InvestmentCard } from "../ui/InvestmentCard";
import { cn } from "~~/lib/utils/cn";
import { useLots } from "~~/hooks/lots/useLots";
import type { ProductionType } from "~~/lib/api/schemas";
import type { LotCategory } from "../../_constants/mockData";
import { containerVariants, itemVariants } from "../animations";

const mapProductionTypeToCategory = (
  productionType: ProductionType,
): LotCategory => {
  switch (productionType) {
    case "PASTURE":
      return "Breeding";
    case "MIXED":
      return "Dairy";
    case "FEEDLOT":
    default:
      return "Fattening";
  }
};

const getExpectedReturn = (lotId: number) => {
  const seed = ((lotId * 7 + 3) % 11);
  const value = 10 + seed * 0.5;
  return `${value.toFixed(1)}%`;
};

const getFundingProgress = (lot: { fundedPercent?: number }) => {
  if (typeof lot.fundedPercent === "number") {
    return lot.fundedPercent;
  }
  return "—";
};

const getSharesAvailable = () => "—";

/**
 * MarketplaceScreen (INV-08)
 * Browse cattle lots for investment
 */
export function MarketplaceScreen() {
  const t = useTranslations("investor.marketplace");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const fallbackText = "—";

  const [selectedCategory, setSelectedCategory] = useState<
    LotCategory | "ALL"
  >("ALL");

  const { data: lots, isPending, error } = useLots();

  const categoryFilters = useMemo(
    () => [
      { key: "ALL" as const, label: t("filters.all") },
      { key: "Breeding" as const, label: t("filters.breeding") },
      { key: "Fattening" as const, label: t("filters.fattening") },
      { key: "Dairy" as const, label: t("filters.dairy") },
    ],
    [t],
  );

  const filteredLots = useMemo(() => {
    if (!lots) {
      return [];
    }
    const eligibleLots = lots.filter(
      (lot) => lot.status === "ACTIVE" || lot.status === "FUNDING",
    );
    if (selectedCategory === "ALL") {
      return eligibleLots;
    }
    return eligibleLots.filter(
      (lot) => mapProductionTypeToCategory(lot.productionType) === selectedCategory,
    );
  }, [lots, selectedCategory]);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-1"
      >
        <h1 className="font-playfair pt-3 text-[28px] font-bold leading-tight text-vaca-neutral-gray-900">
          {t("title")}
        </h1>
        <p className="font-inter text-base text-vaca-neutral-gray-500">
          {t("subtitle")}
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="flex items-center gap-2 text-vaca-neutral-gray-500">
          <Filter className="h-4 w-4" />
          <span className="font-inter text-sm">{t("filters.label")}</span>
        </div>
        {categoryFilters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={cn(
              "rounded-xl px-4 py-2 font-inter text-sm font-medium transition-all",
              selectedCategory === key
                ? "bg-vaca-green text-vaca-neutral-white shadow-md"
                : "border border-vaca-neutral-gray-200 bg-vaca-neutral-white text-vaca-neutral-gray-600 hover:bg-vaca-neutral-gray-50",
            )}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      {isPending && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-3xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white"
            />
          ))}
        </div>
      )}

      {!isPending && error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-vaca-error/10 bg-vaca-error-light p-8 text-center"
        >
          <h3 className="mb-2 font-playfair text-xl font-semibold text-vaca-error-dark">
            {tErrors("generic")}
          </h3>
          <p className="font-inter text-sm text-vaca-error">
            {tErrors("generic")}
          </p>
        </motion.div>
      )}

      {!isPending && !error && filteredLots.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-dashed border-vaca-neutral-gray-200 bg-vaca-neutral-gray-50 py-16 text-center"
        >
          <h3 className="mb-2 font-playfair text-lg font-semibold text-vaca-neutral-gray-900">
            {t("emptyState.title")}
          </h3>
          <p className="font-inter text-sm text-vaca-neutral-gray-600">
            {t("emptyState.description")}
          </p>
        </motion.div>
      )}

      {!isPending && !error && filteredLots.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredLots.map((lot) => {
            const category = mapProductionTypeToCategory(lot.productionType);
            const duration = lot.durationWeeks
              ? `${lot.durationWeeks} ${tCommon("time.weeks")}`
              : fallbackText;

            return (
              <motion.div key={lot.id} variants={itemVariants}>
                <InvestmentCard
                  lotId={lot.id}
                  name={lot.name}
                  location={lot.location || fallbackText}
                  duration={duration}
                  expectedReturn={getExpectedReturn(lot.id)}
                  fundingProgress={getFundingProgress(lot)}
                  category={category}
                  pricePerShare={lot.pricePerShare ?? fallbackText}
                  sharesAvailable={getSharesAvailable()}
                  fundingDeadline={lot.fundingDeadline}
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
