"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "~~/components/ui/Button";
import type { OfferDto } from "~~/lib/api/schemas";
import { cn } from "~~/lib/utils/cn";
import { formatStrkWei } from "~~/utils/scaffold-stark/common";

interface OfferShareCardProps {
  offer: OfferDto;
  isCancelling?: boolean;
  onCancel: (offerId: number) => void;
  className?: string;
}

export function OfferShareCard({
  offer,
  isCancelling = false,
  onCancel,
  className,
}: OfferShareCardProps) {
  const t = useTranslations("investor.dashboard.offers");
  const remainingShares = offer.sharesAmount - offer.sharesFilled;
  const fillPercent =
    offer.sharesAmount > 0
      ? (offer.sharesFilled / offer.sharesAmount) * 100
      : 0;

  const isStrk = offer.currency === "STRK";
  const priceLabel =
    isStrk && offer.strkPricePerShare
      ? `${formatStrkWei(offer.strkPricePerShare)} STRK`
      : new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: offer.currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(offer.pricePerShare / 100);

  const lotName = offer.lot?.name ?? `Lot #${offer.lotId}`;

  return (
    <div
      className={cn(
        "rounded-2xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-4 shadow-sm",
        className,
      )}
    >
      {/* Lot name + ID */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-playfair text-base font-semibold text-vaca-neutral-gray-900 truncate">
          {lotName}
        </h3>
        <span className="shrink-0 font-inter text-xs text-vaca-neutral-gray-400">
          ID #{offer.lotId}
        </span>
      </div>

      {/* Shares selling + Price per share */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-inter text-[10px] font-medium uppercase tracking-widest text-vaca-neutral-gray-400">
            {t("card.selling")}
          </p>
          <p className="mt-0.5 font-inter text-sm font-semibold text-vaca-neutral-gray-900">
            {offer.sharesAmount} {t("card.shares")}
          </p>
        </div>
        <div className="text-right">
          <p className="font-inter text-[10px] font-medium uppercase tracking-widest text-vaca-neutral-gray-400">
            {t("card.pricePerShare")}
          </p>
          <p className="mt-0.5 font-inter text-sm font-semibold text-vaca-green">
            {priceLabel}
          </p>
        </div>
      </div>

      {/* Fill rate progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="font-inter text-[10px] font-medium uppercase tracking-widest text-vaca-neutral-gray-400">
            {t("card.fulfillment")}
          </span>
          <span className="font-inter text-xs font-semibold text-vaca-neutral-gray-700">
            {offer.sharesFilled}/{offer.sharesAmount} ({Math.round(fillPercent)}
            %)
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-vaca-neutral-gray-200">
          <div
            className="h-full rounded-full bg-vaca-green transition-all"
            style={{ width: `${Math.min(fillPercent, 100)}%` }}
          />
        </div>
        {remainingShares > 0 && (
          <p className="mt-1 font-inter text-[10px] text-vaca-neutral-gray-400">
            {t("card.remainingShares", { count: remainingShares })}
          </p>
        )}
      </div>

      {/* Cancel button */}
      <Button
        variant="outline"
        colorScheme="neutral"
        size="sm"
        fullWidth
        onClick={() => onCancel(offer.id)}
        disabled={isCancelling}
        icon={<X className="h-4 w-4" />}
        iconPosition="left"
        className="mt-3"
      >
        {isCancelling ? t("actions.canceling") : t("actions.cancel")}
      </Button>
    </div>
  );
}
