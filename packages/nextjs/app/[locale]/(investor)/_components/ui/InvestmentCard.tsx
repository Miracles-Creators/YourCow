"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { MapPin, Clock, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { LotCategory } from "../../_constants/mockData";
import { cn } from "~~/lib/utils/cn";

const CATEGORY_BADGE_STYLES: Record<LotCategory, string> = {
  Fattening: "bg-vaca-warning-light text-vaca-warning",
  Breeding: "bg-vaca-blue/10 text-vaca-blue-dark",
  Dairy: "bg-vaca-success-light text-vaca-success",
};

const LOT_IMAGES = ["/vaca-image-btc.png", "/images/cattle-field.png"];

function getLotImage(lotId: number): string {
  return LOT_IMAGES[lotId % LOT_IMAGES.length];
}

interface InvestmentCardProps {
  lotId: number;
  name: string;
  location: string;
  duration: string;
  expectedReturn: string;
  fundingProgress: number | string;
  category: LotCategory;
  pricePerShare: number | string;
  sharesAvailable: number | string;
  fundingDeadline?: string | null;
  ownedShares?: number;
  className?: string;
}

export function InvestmentCard({
  lotId,
  name,
  location,
  duration,
  expectedReturn,
  fundingProgress,
  category,
  pricePerShare,
  sharesAvailable,
  fundingDeadline,
  ownedShares,
  className,
}: InvestmentCardProps) {
  const t = useTranslations("investor.marketplace.card");
  const tCategories = useTranslations("investor.lotDetail.categories");

  const translatedCategory =
    category === "Breeding"
      ? tCategories("breeding")
      : category === "Fattening"
        ? tCategories("fattening")
        : tCategories("dairy");

  const daysUntilClose = fundingDeadline
    ? Math.max(0, Math.ceil((new Date(fundingDeadline).getTime() - Date.now()) / 86_400_000))
    : null;

  const progressNum = typeof fundingProgress === "number" ? fundingProgress : null;

  return (
    <Link href={`/lot/${lotId}`}>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white shadow-sm transition-shadow active:scale-[0.99] active:shadow-md",
          className,
        )}
      >
        {/* Hero Image */}
        <div className="relative h-48 w-full bg-vaca-neutral-gray-100">
          <Image
            src={getLotImage(lotId)}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          {/* Category Badge */}
          <div
            className={cn(
              "absolute right-3 top-3 rounded-full px-2.5 py-1 font-inter text-[10px] font-bold uppercase tracking-wider",
              CATEGORY_BADGE_STYLES[category],
            )}
          >
            {translatedCategory}
          </div>

          {/* Contextual Pill */}
          {ownedShares && ownedShares > 0 ? (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-vaca-green/90 px-2.5 py-1 backdrop-blur-sm">
              <CheckCircle className="h-3 w-3 text-white" />
              <span className="font-inter text-[10px] font-bold text-white">
                {t("youOwn", { count: ownedShares })}
              </span>
            </div>
          ) : daysUntilClose !== null && daysUntilClose <= 14 ? (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1 backdrop-blur-sm">
              <Clock className="h-3 w-3 text-vaca-warning" />
              <span className="font-inter text-[10px] font-bold text-vaca-neutral-gray-800">
                {t("closesIn", { days: daysUntilClose })}
              </span>
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title + Price */}
          <div className="mb-1 flex items-start justify-between">
            <h3 className="font-playfair text-lg font-bold leading-tight text-vaca-neutral-gray-900">
              {name}
            </h3>
            <div className="shrink-0 text-right">
              <span className="block font-inter text-xs text-vaca-neutral-gray-400">
                {t("pricePerShare")}
              </span>
              <span className="font-inter text-sm font-bold text-vaca-neutral-gray-900">
                {typeof pricePerShare === "number" ? `$${pricePerShare}` : pricePerShare}
              </span>
            </div>
          </div>

          {/* Location */}
          <p className="mb-4 flex items-center gap-1 font-inter text-xs text-vaca-neutral-gray-500">
            <MapPin className="h-3 w-3" />
            {location}
          </p>

          {/* Stats Grid */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-vaca-neutral-bg p-2.5">
              <span className="block font-inter text-[10px] font-semibold uppercase text-vaca-neutral-gray-400">
                {t("expectedReturn")}
              </span>
              <span className="font-inter font-bold text-vaca-green">{expectedReturn}</span>
            </div>
            <div className="rounded-xl bg-vaca-neutral-bg p-2.5">
              <span className="block font-inter text-[10px] font-semibold uppercase text-vaca-neutral-gray-400">
                {t("duration")}
              </span>
              <span className="font-inter font-bold text-vaca-neutral-gray-600">{duration}</span>
            </div>
          </div>

          {/* Funding Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-inter text-xs font-medium">
              <span className="text-vaca-neutral-gray-900">
                {progressNum !== null ? `${progressNum.toFixed(0)}%` : fundingProgress}{" "}
                {t("funded")}
              </span>
              <span className="text-vaca-neutral-gray-400">
                {typeof sharesAvailable === "number"
                  ? `${sharesAvailable} ${t("sharesAvailable").toLowerCase()}`
                  : sharesAvailable}
              </span>
            </div>
            {progressNum !== null && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-vaca-neutral-gray-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressNum}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full bg-vaca-green"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
