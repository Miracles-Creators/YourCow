"use client";

import { motion } from "framer-motion";
import { MapPin, Calendar, TrendingUp, Shield } from "lucide-react";

import { Card, CardContent } from "~~/components/ui/Card";
import { Badge } from "~~/components/ui/Badge";
import { Button } from "~~/components/ui/Button";
import { ProgressBar } from "~~/components/ui/ProgressBar";
import type { OfferDto } from "~~/lib/api/schemas";
import { formatStrkWei } from "~~/utils/scaffold-stark/common";

export interface OfferCardProps {
  offer: OfferDto;
  onAccept?: (offer: OfferDto) => void;
  onCancel?: (offer: OfferDto) => void;
  isOwner?: boolean;
  className?: string;
}

const statusConfig = {
  OPEN: { tone: "success" as const, label: "Open" },
  PARTIALLY_FILLED: { tone: "info" as const, label: "Partially Filled" },
  FILLED: { tone: "neutral" as const, label: "Sold Out" },
  CANCELLED: { tone: "error" as const, label: "Cancelled" },
};

/**
 * OfferCard - Displays a marketplace sell offer
 * Shows lot info, price, available shares, and action buttons
 */
export function OfferCard({
  offer,
  onAccept,
  onCancel,
  isOwner = false,
  className,
}: OfferCardProps) {
  const fallbackText = "no backend";
  const remainingShares = offer.sharesAmount - offer.sharesFilled;
  const fillPercentage = (offer.sharesFilled / offer.sharesAmount) * 100;
  const totalValue = remainingShares * offer.pricePerShare;
  const status = statusConfig[offer.status];
  const lotName = offer.lot?.name || `Lot #${offer.lotId}`;
  const lotLocation = offer.lot?.location || fallbackText;
  const investorPercentLabel = fallbackText;
  const durationLabel =
    offer.lot?.durationWeeks != null
      ? `${offer.lot.durationWeeks} weeks`
      : fallbackText;

  const isActive = offer.status === "OPEN" || offer.status === "PARTIALLY_FILLED";
  const isStrk = offer.currency === "STRK";

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: offer.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value / 100); // Convert from cents
  };

  const displayPrice = isStrk && offer.strkPricePerShare
    ? `${formatStrkWei(offer.strkPricePerShare)} STRK`
    : formatCurrency(offer.pricePerShare);

  const displayTotalValue = isStrk && offer.strkPricePerShare
    ? `${formatStrkWei((BigInt(offer.strkPricePerShare) * BigInt(remainingShares)).toString())} STRK`
    : formatCurrency(totalValue);

  // Format date
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
      <Card variant="elevated" padding="none" className="overflow-hidden h-full flex flex-col">
        {/* Header with status */}
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
          <Badge tone={status.tone} size="sm">
            {status.label}
          </Badge>
        </div>

        {/* Content */}
        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Price per share */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-vaca-neutral-gray-500">Price per share</p>
              {isStrk && <Shield className="h-3.5 w-3.5 text-vaca-green" />}
            </div>
            <p className="text-2xl font-bold text-vaca-green">
              {displayPrice}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-vaca-neutral-gray-50 rounded-lg p-3">
              <p className="text-xs text-vaca-neutral-gray-500 mb-0.5">Available</p>
              <p className="text-sm font-semibold text-vaca-neutral-gray-900">
                {remainingShares.toLocaleString()} shares
              </p>
            </div>
            <div className="bg-vaca-neutral-gray-50 rounded-lg p-3">
              <p className="text-xs text-vaca-neutral-gray-500 mb-0.5">Total Value</p>
              <p className="text-sm font-semibold text-vaca-neutral-gray-900">
                {displayTotalValue}
              </p>
            </div>
          </div>

          {/* Progress bar for partially filled */}
          {offer.sharesFilled > 0 && (
            <div className="mb-4">
              <ProgressBar
                value={fillPercentage}
                size="sm"
                color="green"
                label={`${offer.sharesFilled} of ${offer.sharesAmount} sold`}
              />
            </div>
          )}

          {/* Lot info if available */}
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

          {/* Seller info */}
          <div className="flex items-center gap-2 text-xs text-vaca-neutral-gray-500 mb-4">
            <span>Seller:</span>
            <span className="font-medium text-vaca-neutral-gray-700">
              {offer.seller?.name || `User #${offer.sellerId}`}
            </span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <div className="pt-4 border-t border-vaca-neutral-gray-100">
            {isOwner && isActive ? (
              <Button
                variant="outline"
                colorScheme="neutral"
                size="sm"
                fullWidth
                onClick={() => onCancel?.(offer)}
              >
                Cancel Offer
              </Button>
            ) : isActive ? (
              <Button
                variant="primary"
                colorScheme="green"
                size="sm"
                fullWidth
                onClick={() => onAccept?.(offer)}
              >
                Buy Shares
              </Button>
            ) : (
              <div className="text-center text-sm text-vaca-neutral-gray-400">
                {offer.status === "FILLED" ? "Offer completed" : "Offer cancelled"}
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer with date */}
        <div className="px-4 py-2 bg-vaca-neutral-gray-50 text-xs text-vaca-neutral-gray-500 text-center">
          Listed {formatDate(offer.createdAt)}
        </div>
      </Card>
    </motion.div>
  );
}
