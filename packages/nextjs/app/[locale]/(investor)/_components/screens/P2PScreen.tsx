"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Filter } from "lucide-react";
import { useTranslations } from "next-intl";

import { OfferList } from "../marketplace/OfferList";
import { AcceptOfferModal } from "../marketplace/AcceptOfferModal";
import { CreateOfferModal } from "../marketplace/CreateOfferModal";
import { PortfolioSummary } from "../marketplace/PortfolioSummary";
import { cn } from "~~/lib/utils/cn";
import { useMe } from "~~/hooks/auth/useMe";
import {
  useCancelOffer,
  useOffers,
  usePortfolio,
} from "~~/hooks/marketplace";
import type {
  OfferDto,
  OfferStatus,
  PortfolioLotPositionDto,
} from "~~/lib/api/schemas";

/**
 * P2PScreen
 * Secondary marketplace for trading shares between investors
 */
export function P2PScreen() {
  const t = useTranslations("investor.p2p");
  const fallbackText = "no backend";

  const { data: me } = useMe();
  const [selectedStatus, setSelectedStatus] = useState<OfferStatus | "ALL">(
    "OPEN",
  );
  const [selectedOffer, setSelectedOffer] = useState<OfferDto | null>(null);
  const [createOfferPosition, setCreateOfferPosition] =
    useState<PortfolioLotPositionDto | null>(null);

  const statusFilters = useMemo(
    () => [
      { key: "OPEN" as const, label: t("filters.open") },
      { key: "PARTIALLY_FILLED" as const, label: t("filters.partiallyFilled") },
      { key: "ALL" as const, label: t("filters.all") },
    ],
    [t],
  );

  const offerFilters = useMemo(() => {
    if (selectedStatus === "ALL") {
      return undefined;
    }
    return { status: selectedStatus };
  }, [selectedStatus]);

  const { data: offers, isPending, error } = useOffers(offerFilters);
  const {
    data: portfolio,
    isPending: isPortfolioLoading,
    error: portfolioError,
  } = usePortfolio();
  const cancelOffer = useCancelOffer();
  const hasCustodyPositions = Boolean(portfolio?.lots?.length);

  const handleAccept = (offer: OfferDto) => {
    setSelectedOffer(offer);
  };

  const handleCancel = (offer: OfferDto) => {
    cancelOffer.mutate(offer.id);
  };

  const handleCreateOffer = (lotId: number) => {
    const position = portfolio?.lots.find((item) => item.lotId === lotId) ?? null;
    setCreateOfferPosition(position);
  };

  const closeAcceptModal = () => setSelectedOffer(null);
  const closeCreateModal = () => setCreateOfferPosition(null);

  const portfolioForSummary = portfolio;

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3"
      >
        <h1 className="font-playfair text-3xl font-bold tracking-tight text-vaca-green sm:text-4xl">
          {t("title")}
        </h1>
        <p className="font-inter text-lg text-vaca-neutral-gray-600">
          {t("subtitle")}
        </p>
      </motion.div>

      {/* Portfolio summary */}
      <PortfolioSummary
        portfolio={portfolioForSummary}
        isLoading={isPortfolioLoading}
        error={portfolioError as Error | null}
        onCreateOffer={hasCustodyPositions ? handleCreateOffer : undefined}
      />

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
        {statusFilters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedStatus(key)}
            className={cn(
              "rounded-xl px-4 py-2 font-inter text-sm font-medium transition-all",
              selectedStatus === key
                ? "bg-vaca-green text-vaca-neutral-white shadow-md"
                : "border border-vaca-neutral-gray-200 bg-vaca-neutral-white text-vaca-neutral-gray-600 hover:bg-vaca-neutral-gray-50",
            )}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* Offers list */}
      <OfferList
        offers={offers ?? []}
        isLoading={isPending}
        error={error as Error | null}
        onAccept={handleAccept}
        onCancel={handleCancel}
        currentUserId={me?.id}
        emptyMessage={t("emptyState.description")}
      />

      <AcceptOfferModal
        isOpen={Boolean(selectedOffer)}
        onClose={closeAcceptModal}
        offer={selectedOffer}
        portfolio={portfolio}
      />

      {createOfferPosition && (
        <CreateOfferModal
          isOpen={Boolean(createOfferPosition)}
          onClose={closeCreateModal}
          lotId={createOfferPosition.lotId}
          lotName={createOfferPosition.lotName ?? fallbackText}
          position={createOfferPosition}
        />
      )}
    </div>
  );
}
