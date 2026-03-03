"use client";

import Image from "next/image";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "~~/lib/utils/cn";
import type { LotStatus, PortfolioSummaryLotDto } from "~~/lib/api/schemas";

const STATUS_CONFIG: Record<LotStatus, { dot: string; badge: string }> = {
  ACTIVE: { dot: "bg-vaca-green", badge: "bg-vaca-green/10 text-vaca-green border-vaca-green/20" },
  FUNDING: { dot: "bg-vaca-gold", badge: "bg-vaca-gold-light text-vaca-gold border-vaca-gold-border" },
  COMPLETED: { dot: "bg-vaca-blue", badge: "bg-vaca-blue/10 text-vaca-blue-dark border-vaca-blue/20" },
  SETTLING: { dot: "bg-vaca-warning", badge: "bg-vaca-warning-light text-vaca-warning border-vaca-warning/20" },
  DRAFT: { dot: "bg-vaca-neutral-gray-400", badge: "bg-vaca-neutral-gray-100 text-vaca-neutral-gray-500 border-vaca-neutral-gray-200" },
  PENDING_DEPLOY: { dot: "bg-vaca-neutral-gray-400", badge: "bg-vaca-neutral-gray-100 text-vaca-neutral-gray-500 border-vaca-neutral-gray-200" },
};

const LOT_IMAGE = "/vaca-image-btc.png";

interface PositionCardProps {
  lot: PortfolioSummaryLotDto;
  className?: string;
}

export function PositionCard({ lot, className }: PositionCardProps) {
  const t = useTranslations("investor.dashboard");
  const tStatus = useTranslations("common.status");
  const tCategories = useTranslations("investor.lotDetail.categories");

  const gain = lot.currentValue - lot.invested;
  const isPositive = gain >= 0;

  const config = STATUS_CONFIG[lot.status] ?? STATUS_CONFIG.ACTIVE;

  const statusLabel =
    lot.status === "ACTIVE" ? tStatus("active") :
    lot.status === "FUNDING" ? tStatus("pending") :
    lot.status === "COMPLETED" ? tStatus("completed") :
    lot.status;

  const productionLabel =
    lot.productionType === "FEEDLOT" ? tCategories("fattening") :
    lot.productionType === "PASTURE" ? tCategories("breeding") :
    tCategories("dairy");

  const barWidth = Math.min(Math.abs(lot.returnPercent), 30);
  const barPercent = (barWidth / 30) * 100;

  const endDate = lot.estimatedEndDate ? new Date(lot.estimatedEndDate) : null;
  const endDateLabel = endDate
    ? endDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    : null;

  return (
    <Link
      href={`/position/${lot.lotId}`}
      className={cn(
        "group block rounded-xl border-2 border-vaca-neutral-gray-200 bg-vaca-neutral-white",
        "p-4 transition-all duration-200",
        "hover:border-vaca-green/30 hover:shadow-md",
        className,
      )}
    >
      {/* Row 1: image + name/type + value */}
      <div className="flex gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-vaca-gold/10">
          <Image
            src={LOT_IMAGE}
            alt={lot.lotName}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="48px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-playfair text-base font-semibold text-vaca-neutral-gray-900">
                {lot.lotName}
              </h3>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="font-inter text-xs text-vaca-neutral-gray-500">
                  {productionLabel}
                </span>
                <span className="text-vaca-neutral-gray-300">·</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-inter text-xs font-medium",
                    config.badge.split(" ").filter(c => c.startsWith("text-")).join(" "),
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div className="font-playfair text-lg font-semibold text-vaca-neutral-gray-900">
                ${lot.currentValue.toLocaleString()}
              </div>
              <div
                className={cn(
                  "flex items-center justify-end gap-0.5 font-inter text-xs font-medium",
                  isPositive ? "text-vaca-green" : "text-vaca-error",
                )}
              >
                {isPositive
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />
                }
                {isPositive ? "+" : ""}{lot.returnPercent.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: return progress bar */}
      <div className="mt-3 flex items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-vaca-neutral-gray-100">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isPositive ? "bg-vaca-green" : "bg-vaca-error",
            )}
            style={{ width: `${barPercent}%` }}
          />
        </div>
        <span
          className={cn(
            "shrink-0 font-inter text-xs font-semibold tabular-nums",
            isPositive ? "text-vaca-green" : "text-vaca-error",
          )}
        >
          {isPositive ? "+" : ""}${Math.abs(gain).toLocaleString()}
        </span>
      </div>

      {/* Row 3: key stats */}
      <div className="mt-2.5 flex items-center gap-1.5 font-inter text-[11px] text-vaca-neutral-gray-500">
        <span className="tabular-nums">
          ${lot.invested.toLocaleString()} {t("stats.invested")}
        </span>
        {lot.daysRemaining != null && (
          <>
            <span className="text-vaca-neutral-gray-300">·</span>
            <span className="tabular-nums">
              {lot.daysRemaining}d {t("stats.left")}
            </span>
          </>
        )}
        {endDateLabel && (
          <>
            <span className="text-vaca-neutral-gray-300">·</span>
            <span>{endDateLabel}</span>
          </>
        )}
        {lot.weightGainPercent != null && (
          <>
            <span className="text-vaca-neutral-gray-300">·</span>
            <span className="tabular-nums text-vaca-green">
              +{lot.weightGainPercent.toFixed(1)}% {t("stats.weightGain")}
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
