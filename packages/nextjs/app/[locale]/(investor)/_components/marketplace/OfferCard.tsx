"use client";

import { motion } from "framer-motion";
import { MapPin, Calendar, TrendingUp, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "~~/components/ui/Card";
import { Badge } from "~~/components/ui/Badge";
import { Button } from "~~/components/ui/Button";
import { ProgressBar } from "~~/components/ui/ProgressBar";
import type { OfferDto } from "~~/lib/api/schemas";
import { formatStrkWei } from "~~/utils/scaffold-stark/common";
import { formatCurrency } from "~~/lib/utils/formatCurrency";

export interface OfferCardProps {
  offer: OfferDto;
  onAccept?: (offer: OfferDto) => void;
  onCancel?: (offer: OfferDto) => void;
  isOwner?: boolean;
  className?: string;
}

const STATUS_TONE = {
  OPEN: "success" as const,
  PARTIALLY_FILLED: "info" as const,
  FILLED: "neutral" as const,
  CANCELLED: "error" as const,
};

const STATUS_KEY = {
  OPEN: "statusOpen",
  PARTIALLY_FILLED: "statusPartiallyFilled",
  FILLED: "statusSoldOut",
  CANCELLED: "statusCancelled",
} as const;

export function OfferCard({
  offer,
  onAccept,
  onCancel,
  isOwner = false,
  className,
}: OfferCardProps) {
  const t = useTranslations("investor.trade");
  const tCard = useTranslations("investor.trade.offerCard");

  const fallbackText = "no backend";
  const remainingShares = offer.sharesAmount - offer.sharesFilled;
  const fillPercentage = (offer.sharesFilled / offer.sharesAmount) * 100;
  const totalValue = remainingShares * offer.pricePerShare;
  const lotName = offer.lot?.name || `Lot #${offer.lotId}`;
  const lotLocation = offer.lot?.location || fallbackText;
  const investorPercentLabel = fallbackText;
  const durationLabel =
    offer.lot?.durationWeeks != null
      ? `${offer.lot.durationWeeks} ${t("weeks")}`
      : fallbackText;

  const isActive =
    offer.status === "OPEN" || offer.status === "PARTIALLY_FILLED";
  const isStrk = offer.currency === "STRK";

  const fmtCurrency = (centavos: number) =>
    formatCurrency(centavos, offer.currency);

  const displayPrice =
    isStrk && offer.strkPricePerShare
      ? `${formatStrkWei(offer.strkPricePerShare)} STRK`
      : fmtCurrency(offer.pricePerShare);

  const displayTotalValue =
    isStrk && offer.strkPricePerShare
      ? `${formatStrkWei((BigInt(offer.strkPricePerShare) * BigInt(remainingShares)).toString())} STRK`
      : fmtCurrency(totalValue);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  };

  return (
    <motion.div
      whileHover={isActive ? { y: -4 } : undefined}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }}
      className={className}
    >
      <Card
        variant="elevated"
        padding="none"
        className="overflow-hidden h-full flex flex-col"
      >
        <div className="p-4 pb-0 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-playfair text-lg font-semibold text-vaca-neutral-gray-900 line-clamp-1">
              {lotName}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-sm text-vaca-neutral-gray-500">
              <MapPin className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{lotLocation}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge tone={isStrk ? "warning" : "success"} size="sm">
              {offer.currency}
            </Badge>
            <Badge tone={STATUS_TONE[offer.status]} size="sm">
              {tCard(STATUS_KEY[offer.status])}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-vaca-neutral-gray-500">
                {tCard("pricePerShare")}
              </p>
              {isStrk && <Shield className="h-3.5 w-3.5 text-vaca-green" />}
            </div>
            <p
              className={`text-2xl font-bold ${isStrk ? "text-vaca-brown" : "text-vaca-green"}`}
            >
              {displayPrice}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-vaca-neutral-gray-50 rounded-lg p-3">
              <p className="text-xs text-vaca-neutral-gray-500 mb-0.5">
                {tCard("available")}
              </p>
              <p className="text-sm font-semibold text-vaca-neutral-gray-900">
                {remainingShares.toLocaleString()} {t("shares")}
              </p>
            </div>
            <div className="bg-vaca-neutral-gray-50 rounded-lg p-3">
              <p className="text-xs text-vaca-neutral-gray-500 mb-0.5">
                {tCard("totalValue")}
              </p>
              <p className="text-sm font-semibold text-vaca-neutral-gray-900">
                {displayTotalValue}
              </p>
            </div>
          </div>

          {offer.sharesFilled > 0 && (
            <div className="mb-4">
              <ProgressBar
                value={fillPercentage}
                size="sm"
                color="green"
                label={tCard("soldProgress", {
                  filled: offer.sharesFilled,
                  total: offer.sharesAmount,
                })}
              />
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-vaca-neutral-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{investorPercentLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{durationLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-vaca-neutral-gray-500 mb-4">
            <span>{tCard("seller")}</span>
            <span className="font-medium text-vaca-neutral-gray-700">
              {offer.seller?.name || `User #${offer.sellerId}`}
            </span>
          </div>

          <div className="flex-1" />

          <div className="pt-4 border-t border-vaca-neutral-gray-100">
            {isOwner && isActive ? (
              <Button
                variant="outline"
                colorScheme="neutral"
                size="sm"
                fullWidth
                onClick={() => onCancel?.(offer)}
              >
                {tCard("cancelOffer")}
              </Button>
            ) : isActive ? (
              <Button
                variant="primary"
                colorScheme={isStrk ? "brown" : "green"}
                size="sm"
                fullWidth
                onClick={() => onAccept?.(offer)}
              >
                {isStrk ? t("buyWithStrk") : t("buyShares")}
              </Button>
            ) : (
              <div className="text-center text-sm text-vaca-neutral-gray-400">
                {offer.status === "FILLED"
                  ? tCard("offerCompleted")
                  : tCard("offerCancelled")}
              </div>
            )}
          </div>
        </CardContent>

        <div className="px-4 py-2 bg-vaca-neutral-gray-50 text-xs text-vaca-neutral-gray-500 text-center">
          {tCard("listed", { date: formatDate(offer.createdAt) })}
        </div>
      </Card>
    </motion.div>
  );
}
