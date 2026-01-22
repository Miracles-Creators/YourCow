"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "~~/lib/utils/cn";
import {
  calculateEstimatedReturn,
  calculateParticipation,
  calculateShares,
} from "~~/utils/investment";
import { useLot } from "~~/hooks/lots/useLot";
import { PrimaryButton } from "../ui/PrimaryButton";

interface InvestAmountScreenProps {
  lotId: number;
}

/**
 * InvestAmountScreen (INV-10)
 * Specify investment amount with real-time calculations
 */
export function InvestAmountScreen({ lotId }: InvestAmountScreenProps) {
  const t = useTranslations("investor.invest");
  const tCommon = useTranslations("common");

  const router = useRouter();
  const { data: lotData, isPending } = useLot(lotId);
  const lot = lotData ?? null;
  const metadata =
    lot?.metadata && typeof lot.metadata === "object"
      ? (lot.metadata as Record<string, unknown>)
      : {};
  const fallbackText = "sin back-end";
  const [amount, setAmount] = useState(0);
  const [shares, setShares] = useState(0);
  const [participation, setParticipation] = useState(0);
  const [estimatedReturn, setEstimatedReturn] = useState("$0-$0");
  const pricePerShare = lot ? Number(lot.pricePerShare) : 0;
  const totalShares = lot ? Number(lot.totalShares) : 0;
  const hasPricing = Boolean(lot) && pricePerShare > 0 && totalShares > 0;

  // Real-time calculation on amount change
  useEffect(() => {
    if (!hasPricing || amount <= 0) {
      setShares(0);
      setParticipation(0);
      setEstimatedReturn("$0-$0");
      return;
    }

    const nextShares = calculateShares(amount, pricePerShare);
    setShares(nextShares);
    setParticipation(calculateParticipation(nextShares, totalShares));
    setEstimatedReturn("<= Definir esto");
  }, [amount, hasPricing, pricePerShare, totalShares]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value === "") {
      setAmount(0);
      return;
    }
    const numValue = parseInt(value);
    setAmount(numValue);
  };

  const sharesAvailable =
    typeof metadata.sharesAvailable === "number"
      ? metadata.sharesAvailable
      : totalShares;
  const maxAmount = hasPricing ? sharesAvailable * pricePerShare : 0;
  const exceedsAvailable = hasPricing && amount > maxAmount;
  const isValid = amount > 0 && Boolean(lot) && hasPricing && !exceedsAvailable;

  if (isPending && !lot) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center font-inter text-sm text-vaca-neutral-gray-500">
          {tCommon("loading.default")}
        </div>
      </div>
    );
  }

  if (!lot && !isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 font-playfair text-2xl font-semibold text-vaca-neutral-gray-900">
            {tCommon("errors.notFound")}
          </h2>
          <Link
            href="/marketplace"
            className="font-inter text-sm text-vaca-blue hover:underline"
          >
            ← {tCommon("actions.back")} to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Back Button */}
      <Link
        href={`/lot/${lotId}`}
        className="mb-6 inline-flex items-center gap-2 font-inter text-sm font-medium text-vaca-neutral-gray-600 transition-colors hover:text-vaca-green"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {tCommon("actions.back")} to Lot Details
      </Link>

      {/* Lot Name Reminder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-playfair text-2xl font-semibold text-vaca-neutral-gray-900 sm:text-3xl">
          {t("title")} {lot?.name || fallbackText}
        </h1>
      </motion.div>

      {/* Amount Input Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 rounded-xl bg-vaca-neutral-white p-8 shadow-md"
      >
        <label
          htmlFor="amount"
          className="mb-4 block font-inter text-sm font-medium text-vaca-neutral-gray-700"
        >
          {t("amountLabel")}
        </label>

        {/* Large Currency Input */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <span className="font-playfair text-5xl font-semibold text-vaca-neutral-gray-400">
              $
            </span>
          </div>
          <input
            id="amount"
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={handleAmountChange}
            placeholder="50,000"
            autoFocus
            className={cn(
              "w-full rounded-xl border-2 bg-vaca-neutral-white py-6 pl-16 pr-4",
              "font-playfair text-5xl font-semibold text-vaca-neutral-gray-900",
              "transition-all duration-200",
              "focus:outline-none focus:ring-4",
              "border-vaca-neutral-gray-200 focus:border-vaca-green focus:ring-vaca-green/10",
            )}
            aria-label="Investment amount in dollars"
          />
        </div>
        {exceedsAvailable && (
          <p className="mt-3 font-inter text-sm text-red-600">
            {`Monto maximo disponible: $${maxAmount.toLocaleString()}`}
          </p>
        )}
      </motion.div>

      {/* Investment Breakdown */}
      <AnimatePresence>
        {isValid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="mb-8 rounded-xl border-l-4 border-vaca-green bg-vaca-neutral-white p-6 shadow-md"
          >
            <h3 className="mb-4 font-inter text-sm font-medium uppercase tracking-wide text-vaca-neutral-gray-500">
              Investment Breakdown
            </h3>

            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="font-inter text-sm text-vaca-neutral-gray-600">
                  {t("calculation.shares")}
                </span>
                <motion.span
                  key={shares}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-playfair text-2xl font-semibold text-vaca-green"
                >
                  {hasPricing
                    ? `${shares} units`
                    : fallbackText}
                </motion.span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="font-inter text-sm text-vaca-neutral-gray-600">
                  Participation
                </span>
                <motion.span
                  key={participation}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-playfair text-2xl font-semibold text-vaca-blue"
                >
                  {hasPricing
                    ? `${participation}%`
                    : fallbackText}
                </motion.span>
              </div>

              <div className="border-t border-vaca-neutral-gray-200 pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-inter text-sm font-medium text-vaca-neutral-gray-900">
                    Total Investment
                  </span>
                  <span className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
                    ${amount.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-inter text-sm text-vaca-neutral-gray-600">
                    Estimated Return
                  </span>
                  <motion.span
                    key={estimatedReturn}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-inter text-sm font-semibold text-vaca-green"
                  >
                    {estimatedReturn === "$0-$0" ? fallbackText : estimatedReturn}
                  </motion.span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <PrimaryButton
          type="button"
          disabled={!isValid}
          className="w-full"
          size="lg"
          onClick={() => {
            // Navigate to confirmation screen with investment details
            router.push(
              `/confirm-investment/${lotId}?amount=${amount}&shares=${shares}`,
            );
          }}
        >
          {t("continueButton")}
        </PrimaryButton>
      </motion.div>
    </div>
  );
}
