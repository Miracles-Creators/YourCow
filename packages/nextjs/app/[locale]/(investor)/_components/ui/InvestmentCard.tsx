"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { MapPin, Calendar, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import type { LotCategory } from "../../_constants/mockData";
import { cn } from "~~/lib/utils/cn";

interface InvestmentCardProps {
  lotId: number;
  name: string;
  location: string;
  duration: string;
  expectedReturn: string;
  fundingProgress: number | string;
  herdSize: number | string;
  category: LotCategory;
  pricePerShare: number | string;
  sharesAvailable: number | string;
  className?: string;
}

/**
 * InvestmentCard - Display cattle lot in marketplace grid
 * Shows key lot information with funding progress
 */
export function InvestmentCard({
  lotId,
  name,
  location,
  duration,
  expectedReturn,
  fundingProgress,
  herdSize,
  category,
  pricePerShare,
  sharesAvailable,
  className,
}: InvestmentCardProps) {
  const t = useTranslations("investor.marketplace.card");
  const tCategories = useTranslations("investor.lotDetail.categories");

  const getTranslatedCategory = (cat: LotCategory) => {
    switch (cat) {
      case "Breeding":
        return tCategories("breeding");
      case "Fattening":
        return tCategories("fattening");
      case "Dairy":
        return tCategories("dairy");
      default:
        return cat;
    }
  };

  const getCategoryColor = (cat: LotCategory) => {
    switch (cat) {
      case "Breeding":
        return "bg-vaca-green/10 text-vaca-green";
      case "Fattening":
        return "bg-amber-50 text-amber-700";
      case "Dairy":
        return "bg-vaca-blue/10 text-vaca-blue";
    }
  };

  const formatValue = (value: number | string, suffix?: string) =>
    typeof value === "number" ? `${value}${suffix ?? ""}` : value;

  return (
    <Link href={`/lot/${lotId}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        className={cn(
          "cursor-pointer overflow-hidden rounded-3xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-6 shadow-sm transition-all hover:shadow-xl",
          className,
        )}
      >
        {/* Header */}
        <div className="mb-4">
          <span
            className={cn(
              "mb-3 inline-block rounded-lg px-3 py-1 font-inter text-xs font-medium",
              getCategoryColor(category),
            )}
          >
            {getTranslatedCategory(category)}
          </span>
          <h3 className="mb-1 font-playfair text-xl font-semibold text-vaca-green">
            {name}
          </h3>
          <div className="flex items-center gap-1 font-inter text-sm text-vaca-neutral-gray-500">
            <MapPin className="h-3 w-3" />
            <span>{location}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-inter text-sm text-vaca-neutral-gray-500">
              {t("herdSize")}
            </span>
            <span className="font-inter text-sm font-medium text-vaca-green">
              {formatValue(herdSize, " cattle")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-inter text-sm text-vaca-neutral-gray-500">
              {t("expectedReturn")}
            </span>
            <span className="flex items-center gap-1 font-inter text-sm font-semibold text-vaca-green">
              <TrendingUp className="h-3 w-3 text-amber-600" />
              {expectedReturn}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-inter text-sm text-vaca-neutral-gray-500">
              {t("duration")}
            </span>
            <span className="flex items-center gap-1 font-inter text-sm font-medium text-vaca-green">
              <Calendar className="h-3 w-3" />
              {duration}
            </span>
          </div>
        </div>

        {/* Funding Progress */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between font-inter text-sm">
            <span className="text-vaca-neutral-gray-500">
              {t("fundingProgress")}
            </span>
            <span className="font-medium text-vaca-green">
              {typeof fundingProgress === "number"
                ? `${fundingProgress.toFixed(0)}%`
                : fundingProgress}
            </span>
          </div>
          {typeof fundingProgress === "number" && (
            <div className="h-2 overflow-hidden rounded-full bg-vaca-neutral-gray-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${fundingProgress}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-vaca-green to-green-600"
              />
            </div>
          )}
        </div>

        {/* Price & CTA */}
        <div className="border-t border-vaca-neutral-gray-100 pt-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="mb-1 font-inter text-xs text-vaca-neutral-gray-500">
                {t("pricePerShare")}
              </p>
              <p className="font-playfair text-2xl font-semibold text-vaca-green">
                {typeof pricePerShare === "number"
                  ? `$${pricePerShare}`
                  : pricePerShare}
              </p>
            </div>
            <div className="text-right">
              <p className="font-inter text-xs text-vaca-neutral-gray-500">
                <Users className="mr-1 inline h-3 w-3" />
                {formatValue(
                  sharesAvailable,
                  ` ${t("sharesAvailable").toLowerCase()}`,
                )}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
