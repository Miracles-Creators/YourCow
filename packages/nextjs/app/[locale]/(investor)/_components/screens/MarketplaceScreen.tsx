"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { InvestmentCard } from "../ui/InvestmentCard";
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

/**
 * MarketplaceScreen (INV-08)
 * Browse cattle lots for investment
 */
export function MarketplaceScreen() {
  const t = useTranslations("investor.marketplace");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const fallbackText = "—";

  const { data: lots, isPending, error } = useLots();

  const activeLots = (lots ?? []).filter(
    (lot) => lot.status === "ACTIVE" || lot.status === "FUNDING",
  );

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-4"
      >
        <h1 className="font-playfair text-4xl font-bold tracking-tight text-vaca-neutral-gray-900">
          {t("title")}
        </h1>
        <p className="mt-1 font-inter text-sm font-light text-vaca-neutral-gray-400">
          {t("subtitle")}
        </p>
      </motion.div>

      {/* Content */}
      {isPending && (
        <div className="mt-6 grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
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
          className="mt-8 rounded-2xl border border-vaca-error/10 bg-vaca-error-light p-8 text-center"
        >
          <h3 className="font-playfair text-xl font-semibold text-vaca-error-dark">
            {tErrors("generic")}
          </h3>
        </motion.div>
      )}

      {!isPending && !error && activeLots.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-2xl border-2 border-dashed border-vaca-neutral-gray-200 bg-vaca-neutral-gray-50 py-16 text-center"
        >
          <h3 className="mb-2 font-playfair text-lg font-semibold text-vaca-neutral-gray-900">
            {t("emptyState.title")}
          </h3>
          <p className="font-inter text-sm text-vaca-neutral-gray-600">
            {t("emptyState.description")}
          </p>
        </motion.div>
      )}

      {!isPending && !error && activeLots.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-6 grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3"
        >
          {activeLots.map((lot) => {
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
                  fundingProgress={lot.fundedPercent ?? fallbackText}
                  category={category}
                  pricePerShare={lot.pricePerShare ?? fallbackText}
                  sharesAvailable={fallbackText}
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
