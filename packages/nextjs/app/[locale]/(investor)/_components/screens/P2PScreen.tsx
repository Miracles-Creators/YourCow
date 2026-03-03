"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Filter } from "lucide-react";
import { useTranslations } from "next-intl";

import { InvestmentCard } from "../ui/InvestmentCard";
import { WalletBar } from "../ui/WalletBar";
import { CreateOfferModal } from "../marketplace/CreateOfferModal";
import { FundModal } from "../tongo/FundModal";
import { WithdrawModal } from "../tongo/WithdrawModal";
import { cn } from "~~/lib/utils/cn";
import { useOffers } from "~~/hooks/marketplace";
import type { OfferStatus, ProductionType, PortfolioLotPositionDto } from "~~/lib/api/schemas";
import type { LotCategory } from "../../_constants/mockData";
import { containerVariants, itemVariants } from "../animations";
import { formatStrkWei } from "~~/utils/scaffold-stark/common";

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
  const seed = (lotId * 7 + 3) % 11;
  const value = 10 + seed * 0.5;
  return `${value.toFixed(1)}%`;
};

export function P2PScreen() {
  const t = useTranslations("investor.p2p");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const fallbackText = "—";

  const [selectedStatus, setSelectedStatus] = useState<OfferStatus | "ALL">("OPEN");
  const [createOfferPosition, setCreateOfferPosition] = useState<PortfolioLotPositionDto | null>(null);
  const [isFundOpen, setIsFundOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const statusFilters = useMemo(
    () => [
      { key: "OPEN" as const, label: t("filters.open") },
      { key: "PARTIALLY_FILLED" as const, label: t("filters.partiallyFilled") },
      { key: "ALL" as const, label: t("filters.all") },
    ],
    [t],
  );

  const offerFilters = useMemo(() => {
    if (selectedStatus === "ALL") return undefined;
    return { status: selectedStatus };
  }, [selectedStatus]);

  const { data: offers, isPending, error } = useOffers(offerFilters);

  const closeCreateModal = () => setCreateOfferPosition(null);

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

      {/* Wallet bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mt-5"
      >
        <WalletBar
          onFund={() => setIsFundOpen(true)}
          onWithdraw={() => setIsWithdrawOpen(true)}
        />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 flex flex-wrap items-center gap-3"
      >
        <div className="flex items-center gap-2 text-vaca-neutral-gray-500">
          <Filter className="h-4 w-4" />
          <span className="font-inter text-sm">{t("filters.label")}</span>
        </div>
        {statusFilters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedStatus(key)}
            className={cn(
              "rounded-full px-4 py-2 font-inter text-sm font-medium transition-all",
              selectedStatus === key
                ? "bg-vaca-green text-vaca-neutral-white shadow-md"
                : "border border-vaca-neutral-gray-200 bg-vaca-neutral-white text-vaca-neutral-gray-600 hover:bg-vaca-neutral-gray-50",
            )}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* Loading */}
      {isPending && (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-3xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {!isPending && error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-2xl border border-vaca-error/10 bg-vaca-error-light p-8 text-center"
        >
          <h3 className="mb-2 font-playfair text-xl font-semibold text-vaca-error-dark">
            {tErrors("generic")}
          </h3>
          <p className="font-inter text-sm text-vaca-error">
            {tErrors("generic")}
          </p>
        </motion.div>
      )}

      {/* Empty */}
      {!isPending && !error && (!offers || offers.length === 0) && (
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

      {/* Offers as InvestmentCards */}
      {!isPending && !error && offers && offers.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
        >
          {offers.map((offer) => {
            const lot = offer.lot;
            const category = lot?.productionType
              ? mapProductionTypeToCategory(lot.productionType)
              : "Fattening" as LotCategory;
            const duration = lot?.durationWeeks
              ? `${lot.durationWeeks} ${tCommon("time.weeks")}`
              : fallbackText;
            const sharesAvailable = offer.sharesAmount - offer.sharesFilled;
            const price = offer.strkPricePerShare
              ? `${formatStrkWei(offer.strkPricePerShare)} STRK`
              : `$${offer.pricePerShare}`;

            return (
              <motion.div key={offer.id} variants={itemVariants}>
                <InvestmentCard
                  lotId={offer.lotId}
                  name={lot?.name ?? `Lot #${offer.lotId}`}
                  location={lot?.location ?? fallbackText}
                  duration={duration}
                  expectedReturn={getExpectedReturn(offer.lotId)}
                  fundingProgress={fallbackText}
                  category={category}
                  pricePerShare={price}
                  sharesAvailable={`${sharesAvailable} shares`}
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {createOfferPosition && (
        <CreateOfferModal
          isOpen={Boolean(createOfferPosition)}
          onClose={closeCreateModal}
          lotId={createOfferPosition.lotId}
          lotName={createOfferPosition.lotName ?? fallbackText}
          position={createOfferPosition}
        />
      )}

      <FundModal
        isOpen={isFundOpen}
        onClose={() => setIsFundOpen(false)}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
      />
    </div>
  );
}
