"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "~~/components/ui/Card";
import { Button } from "~~/components/ui/Button";
import type { PortfolioLotPositionDto } from "~~/lib/api/schemas";
import { containerVariants, itemVariants } from "../animations";

const LOT_IMAGES = [
  "/images/cattle-angus.jpg",
  "/images/cattle-hereford.jpg",
  "/vaca-image-btc.png",
];

function getLotImage(lotId: number): string {
  return LOT_IMAGES[lotId % LOT_IMAGES.length];
}

export interface SellPositionListProps {
  positions: PortfolioLotPositionDto[];
  isLoading?: boolean;
  onSell: (position: PortfolioLotPositionDto) => void;
}

export function SellPositionList({
  positions,
  isLoading = false,
  onSell,
}: SellPositionListProps) {
  const t = useTranslations("investor.trade");

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-vaca-neutral-gray-100 p-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-vaca-neutral-gray-100 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-40 rounded bg-vaca-neutral-gray-100" />
                <div className="h-4 w-24 rounded bg-vaca-neutral-gray-100" />
              </div>
              <div className="h-9 w-20 rounded-lg bg-vaca-neutral-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-vaca-neutral-gray-100 flex items-center justify-center mb-4">
          <ShoppingBag className="h-8 w-8 text-vaca-neutral-gray-400" />
        </div>
        <h3 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900 mb-2">
          {t("noSharesToSell")}
        </h3>
        <p className="text-sm text-vaca-neutral-gray-500 max-w-sm">
          {t("noSharesDescription")}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {positions.map((position) => {
        const available = parseFloat(position.available);
        const locked = parseFloat(position.locked);

        return (
          <motion.div key={position.lotId} variants={itemVariants}>
            <Card variant="bordered" padding="none" className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={getLotImage(position.lotId)}
                      alt={position.lotName || `Lot #${position.lotId}`}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-vaca-neutral-gray-900 truncate">
                      {position.lotName || `Lot #${position.lotId}`}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-vaca-neutral-gray-500">
                      <span>
                        {available.toLocaleString()} {t("available")}
                      </span>
                      {locked > 0 && (
                        <span className="text-vaca-neutral-gray-400">
                          {locked.toLocaleString()} {t("locked")}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    colorScheme="green"
                    size="sm"
                    onClick={() => onSell(position)}
                    disabled={available <= 0}
                  >
                    {t("sell")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
