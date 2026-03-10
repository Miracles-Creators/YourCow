"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLot } from "~~/hooks/lots/useLot";
import { cn } from "~~/lib/utils/cn";
import { calculateShares } from "~~/utils/investment";
import { containerVariants, itemVariants } from "../animations";

interface InvestAmountScreenProps {
  lotId: number;
}

export function InvestAmountScreen({ lotId }: InvestAmountScreenProps) {
  const t = useTranslations("investor.invest");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const { data: lot, isPending } = useLot(lotId);

  const [amount, setAmount] = useState(0);
  const [shares, setShares] = useState(0);
  const [estimatedReturn, setEstimatedReturn] = useState(0);

  const pricePerShare = lot?.pricePerShare ?? 0;
  const totalShares = lot?.totalShares ?? 0;
  const investorPercent = lot?.investorPercent ?? 0;
  const hasPricing = pricePerShare > 0 && totalShares > 0;

  const metadata =
    lot?.metadata && typeof lot.metadata === "object"
      ? (lot.metadata as Record<string, unknown>)
      : {};
  const sharesAvailable =
    typeof metadata.sharesAvailable === "number"
      ? metadata.sharesAvailable
      : totalShares;
  const maxAmount = hasPricing ? sharesAvailable * pricePerShare : 0;
  const exceedsAvailable = hasPricing && amount > maxAmount;
  const isValid = amount > 0 && hasPricing && !exceedsAvailable;

  useEffect(() => {
    if (!hasPricing || amount <= 0) {
      setShares(0);
      setEstimatedReturn(0);
      return;
    }
    const nextShares = calculateShares(amount, pricePerShare);
    setShares(nextShares);
    setEstimatedReturn(
      Math.round(nextShares * pricePerShare * (investorPercent / 100)),
    );
  }, [amount, hasPricing, pricePerShare, totalShares, investorPercent]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setAmount(value === "" ? 0 : Number(value));
  };

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-vaca-green/20 border-t-vaca-green" />
      </div>
    );
  }

  if (!lot) {
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
            ← {tCommon("actions.back")}
          </Link>
        </div>
      </div>
    );
  }

  const ctaButton = (
    <motion.button
      whileHover={isValid ? { scale: 1.01 } : undefined}
      whileTap={isValid ? { scale: 0.97 } : undefined}
      disabled={!isValid}
      onClick={() =>
        router.push(
          `/confirm-investment/${lotId}?amount=${amount}&shares=${shares}`,
        )
      }
      className={cn(
        "flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-inter text-base font-bold transition-all",
        isValid
          ? "bg-gradient-to-r from-vaca-green to-vaca-green-light text-white shadow-xl shadow-vaca-green/30"
          : "bg-vaca-neutral-gray-100 text-vaca-neutral-gray-400",
      )}
    >
      {t("continueButton")}
    </motion.button>
  );

  return (
    <div className="relative pb-32 lg:pb-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-[430px] px-7 pt-4 lg:max-w-xl lg:px-0 lg:pt-10"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8 lg:mb-6">
          <Link
            href={`/lot/${lotId}`}
            className="mb-5 inline-flex items-center gap-2 font-inter text-sm text-vaca-neutral-gray-500 transition-colors hover:text-vaca-green"
          >
            <ArrowLeft className="h-4 w-4" />
            {tCommon("actions.back")}
          </Link>
          <h1 className="font-playfair text-2xl leading-tight text-vaca-neutral-gray-900 lg:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 font-inter text-sm text-vaca-neutral-gray-400">
            {lot.name}
          </p>
        </motion.div>

        {/* Desktop card wrapper */}
        <div className="lg:rounded-2xl lg:border lg:border-vaca-neutral-gray-100 lg:bg-vaca-neutral-white lg:p-8">
          {/* Amount Input */}
          <motion.div variants={itemVariants} className="mb-6">
            <label
              htmlFor="amount"
              className="mb-2 block font-inter text-[10px] font-bold uppercase tracking-[0.15em] text-vaca-neutral-gray-400"
            >
              {t("amountLabel")}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
                <span className="font-inter text-4xl font-bold text-vaca-neutral-gray-300">
                  $
                </span>
              </div>
              <input
                id="amount"
                type="text"
                inputMode="numeric"
                value={amount || ""}
                onChange={handleAmountChange}
                placeholder={t("amountPlaceholder")}
                autoFocus
                className={cn(
                  "w-full rounded-2xl border bg-vaca-neutral-white py-5 pl-14 pr-5",
                  "font-inter text-4xl font-bold text-vaca-neutral-gray-900 tabular-nums",
                  "transition-all duration-200 placeholder:text-vaca-neutral-gray-200",
                  "focus:outline-none focus:ring-4",
                  exceedsAvailable
                    ? "border-vaca-error focus:border-vaca-error focus:ring-vaca-error/10"
                    : "border-vaca-neutral-gray-100 focus:border-vaca-green focus:ring-vaca-green/10",
                  "lg:border-vaca-neutral-gray-200 lg:bg-vaca-neutral-bg",
                )}
                aria-label="Investment amount in dollars"
              />
            </div>
            {exceedsAvailable && (
              <p className="mt-2 font-inter text-xs text-vaca-error">
                {t("errors.privateCapacityExceeded")}
              </p>
            )}
            <div className="mt-2 flex items-center gap-3 font-inter text-xs text-vaca-neutral-gray-400">
              <span>${pricePerShare} / share</span>
              <span className="h-1 w-1 rounded-full bg-vaca-neutral-gray-200" />
              <span>{t("privacy.availabilityHidden")}</span>
            </div>
          </motion.div>

          {/* Breakdown — appears when valid */}
          <AnimatePresence>
            {isValid && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-vaca-neutral-gray-50 bg-vaca-neutral-white p-5 shadow-sm lg:border-vaca-neutral-gray-100 lg:bg-vaca-neutral-bg lg:shadow-none"
              >
                <p className="mb-4 font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
                  Investment Breakdown
                </p>

                <div className="space-y-3">
                  <BreakdownRow
                    label={t("calculation.shares")}
                    value={`${shares.toLocaleString()} shares`}
                  />
                  <BreakdownRow
                    label={t("calculation.pricePerShare")}
                    value={`$${pricePerShare}`}
                  />

                  <div className="border-t border-vaca-neutral-gray-50 pt-3">
                    <BreakdownRow
                      label="Total Investment"
                      value={`$${(shares * pricePerShare).toLocaleString()}`}
                      bold
                    />
                  </div>

                  <div className="rounded-xl bg-vaca-green/5 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-inter text-xs text-vaca-neutral-gray-600">
                        Est. Return ({investorPercent}%)
                      </span>
                      <span className="font-inter text-lg font-bold text-vaca-green">
                        +${estimatedReturn.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA — desktop only (inline inside card) */}
          <motion.div variants={itemVariants} className="hidden pt-6 lg:block">
            {ctaButton}
          </motion.div>
        </div>
      </motion.div>

      {/* Fixed Bottom CTA — mobile only */}
      <div className="fixed bottom-[4.5rem] left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 lg:hidden">
        <div className="bg-gradient-to-t from-vaca-neutral-white via-vaca-neutral-white to-vaca-neutral-white/0 px-7 pb-4 pt-4">
          {ctaButton}
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          "font-inter text-xs",
          bold
            ? "font-semibold text-vaca-neutral-gray-900"
            : "text-vaca-neutral-gray-500",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-inter tabular-nums",
          bold
            ? "text-base font-bold text-vaca-neutral-gray-900"
            : "text-sm font-semibold text-vaca-neutral-gray-900",
        )}
      >
        {value}
      </span>
    </div>
  );
}
