"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Clock, CheckCircle, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { LotCategory } from "../../_constants/mockData";
import { cn } from "~~/lib/utils/cn";

const CATEGORY_BADGE_STYLES: Record<LotCategory, string> = {
  Fattening: "bg-vaca-warning-light/90 text-vaca-warning",
  Breeding: "bg-vaca-blue/10 text-vaca-blue-dark",
  Dairy: "bg-vaca-success-light/90 text-vaca-success",
};

const LOT_IMAGES = [
  "/images/cattle-angus.jpg",
  "/images/cattle-hereford.jpg",
  "/vaca-image-btc.png",
];

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
  href?: string;
  onClick?: () => void;
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
  href,
  onClick,
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

  const formattedPrice =
    typeof pricePerShare === "number" ? `$${pricePerShare}` : pricePerShare;

  const sharesLabel = t("sharesAvailable").toLowerCase();
  const formattedShares =
    typeof sharesAvailable === "number" ? `${sharesAvailable} ${sharesLabel}` : sharesAvailable;
  const fundedSideText =
    typeof formattedShares === "string" && formattedShares.trim().length > 0
      ? formattedShares
      : "—";

  const wrapperClassName = cn("group relative flex flex-col", className);
  const resolvedHref = href ?? `/lot/${lotId}`;

  const content = (
    <>
      {/* Hero Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl mb-2.5 shadow-sm group-active:scale-[0.98] transition-transform duration-300">
        <Image
          src={getLotImage(lotId)}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Category Badge — top left */}
        <div className="absolute left-3 top-3">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-inter text-[8px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/20",
              CATEGORY_BADGE_STYLES[category],
            )}
          >
            {translatedCategory}
          </span>
        </div>

        {/* Contextual pill — bottom left */}
        {ownedShares && ownedShares > 0 ? (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-vaca-green/90 px-2 py-0.5 backdrop-blur-sm">
            <CheckCircle className="h-2.5 w-2.5 text-white" />
            <span className="font-inter text-[9px] font-bold text-white">
              {t("youOwn", { count: ownedShares })}
            </span>
          </div>
        ) : daysUntilClose !== null && daysUntilClose <= 14 ? (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 backdrop-blur-sm">
            <Clock className="h-2.5 w-2.5 text-vaca-warning" />
            <span className="font-inter text-[9px] font-bold text-vaca-neutral-gray-700">
              {t("closesIn", { days: daysUntilClose })}
            </span>
          </div>
        ) : null}

        {/* Return overlay — bottom right */}
        <div className="absolute bottom-4 right-4 rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur-md">
          <p className="m-0 text-[9px] font-bold leading-none text-vaca-neutral-gray-400 uppercase tracking-widest mb-1">
            {t("expectedReturn")}
          </p>
          <p className="m-0 ml-2 text-lg font-bold leading-none text-vaca-green">
            {expectedReturn}
          </p>
        </div>
      </div>

      {/* Info below image */}
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h3 className="mt-2 font-playfair text-lg font-semibold leading-none text-vaca-neutral-gray-900">
            {name}
          </h3>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[11px] font-medium leading-none text-vaca-neutral-gray-400">
              {duration}
            </span>
            <span className="w-1 h-1 rounded-full bg-vaca-neutral-gray-200" />
            <span className="text-[11px] font-medium leading-none text-vaca-neutral-gray-400">
              {formattedShares}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="mt-4 text-[10px] font-bold leading-none text-vaca-neutral-gray-300 uppercase tracking-widest">
            {t("pricePerShare")}
          </p>
          <div className="-mt-2 flex items-center justify-end gap-0">
            <p className="m-0 text-lg font-semibold leading-none text-vaca-neutral-gray-900 tabular-nums">
              {formattedPrice}
            </p>
            <ChevronRight className="h-4 w-4 text-vaca-neutral-gray-300" />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {progressNum !== null && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-[13px] font-medium leading-none">
            <span className="m-0 text-vaca-neutral-gray-500">
              {`${progressNum.toFixed(0)}%`} {t("funded")}
            </span>
            <span className="m-0 text-vaca-neutral-gray-300">
              {fundedSideText}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-vaca-neutral-gray-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressNum}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full rounded-full bg-vaca-green"
            />
          </div>
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(wrapperClassName, "cursor-pointer text-left")}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={resolvedHref} className={wrapperClassName}>
      {content}
    </Link>
  );
}
