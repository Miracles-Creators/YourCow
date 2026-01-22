"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLot } from "~~/hooks/lots/useLot";
import { useConfirmPayment } from "~~/hooks/payments/useConfirmPayment";
import { useCreatePayment } from "~~/hooks/payments/useCreatePayment";
import { useMintPayment } from "~~/hooks/payments/useMintPayment";
import { useMe } from "~~/hooks/auth/useMe";
import { cn } from "~~/lib/utils/cn";
import { PrimaryButton } from "../ui/PrimaryButton";

interface ConfirmInvestmentScreenProps {
  lotId: number;
  investmentAmount: number;
  shares: number;
}

/**
 * ConfirmInvestmentScreen (INV-11)
 * Final confirmation before processing investment
 *
 * Shows:
 * - Investment summary
 * - Fees breakdown
 * - Liquidity rules reminder
 * - Final confirm button
 *
 * Style: Neutral, institutional, very clear
 */
export function ConfirmInvestmentScreen({
  lotId,
  investmentAmount,
  shares,
}: ConfirmInvestmentScreenProps) {
  const t = useTranslations("investor.confirmInvestment");
  const tCommon = useTranslations("common");

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: lotData, isPending } = useLot(lotId);
  const lot = lotData ?? null;
  const metadata =
    lot?.metadata && typeof lot.metadata === "object"
      ? (lot.metadata as Record<string, unknown>)
      : {};
  const fallbackText = "sin back-end";
  const { data: me } = useMe();
  const createPayment = useCreatePayment();
  const confirmPayment = useConfirmPayment();
  const mintPayment = useMintPayment();

  // Fee calculations
  const platformFee = investmentAmount * 0.015; // 1.5% platform fee
  const paymentProcessingFee = investmentAmount * 0.029 + 0.3; // Stripe-like fees
  const totalFees = platformFee + paymentProcessingFee;
  const totalAmount = investmentAmount + totalFees;

  const handleConfirm = async () => {
    if (!lot || !me?.id) {
      setErrorMessage("Missing lot or investor data.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payment = await createPayment.mutateAsync({
        paymentIntentId: `mock_${Date.now()}`,
        investorId: me.id,
        lotId: lot.id,
        amountFiat: Math.round(investmentAmount * 100),
        currency: "USD",
        sharesAmount: shares,
      });

      await confirmPayment.mutateAsync({ id: payment.id });
      await mintPayment.mutateAsync({ id: payment.id });

      router.push(
        `/investment-success/${lot.id}?amount=${investmentAmount}&shares=${shares}`,
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-vaca-green/20 border-t-vaca-green" />
          <p className="font-inter text-sm text-vaca-neutral-gray-500">
            {tCommon("loading.default")}
          </p>
        </div>
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
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-2 text-center">
        <h1 className="font-playfair text-3xl font-semibold tracking-tight text-vaca-neutral-gray-900">
          {t("title")}
        </h1>
        <p className="font-inter text-sm text-vaca-neutral-gray-500">
          {t("subtitle")}
        </p>
      </motion.div>

      {/* Investment Summary Card */}
      <motion.div
        variants={itemVariants}
        className={cn(
          "rounded-2xl border-2 border-vaca-neutral-gray-200 bg-vaca-neutral-white",
          "p-6 shadow-sm",
        )}
      >
        <h2 className="mb-4 font-inter text-xs font-semibold uppercase tracking-wide text-vaca-neutral-gray-500">
          Investment Summary
        </h2>

        <div className="space-y-4">
          {/* Lot Name */}
          <div>
            <div className="text-xs font-medium text-vaca-neutral-gray-500">
              {t("lot")}
            </div>
            <div className="mt-1 font-playfair text-lg font-medium text-vaca-neutral-gray-900">
              {lot.name || fallbackText}
            </div>
            <div className="mt-0.5 text-sm text-vaca-neutral-gray-500">
              {lot.location || fallbackText} ·{" "}
              {lot.durationWeeks
                ? `${lot.durationWeeks} weeks`
                : fallbackText}
            </div>
          </div>

          <div className="border-t border-vaca-neutral-gray-100" />

          {/* Investment Amount */}
          <SummaryRow
            label={t("investmentAmount")}
            value={`$${investmentAmount.toLocaleString("en-US")}`}
            valueClassName="text-vaca-neutral-gray-900 font-semibold"
          />

          {/* Shares */}
          <SummaryRow
            label={t("shares")}
            value={shares.toLocaleString("en-US")}
            sublabel={
              lot.totalShares
                ? `${((shares / lot.totalShares) * 100).toFixed(2)}% of lot`
                : fallbackText
            }
          />

          {/* Share Price */}
          <SummaryRow
            label={t("pricePerShare")}
            value={lot.pricePerShare ? `$${lot.pricePerShare}` : fallbackText}
          />
        </div>
      </motion.div>

      {/* Fees Breakdown Card */}
      <motion.div
        variants={itemVariants}
        className={cn(
          "rounded-2xl border-2 border-vaca-neutral-gray-200 bg-vaca-neutral-white",
          "p-6 shadow-sm",
        )}
      >
        <h2 className="mb-4 font-inter text-xs font-semibold uppercase tracking-wide text-vaca-neutral-gray-500">
          Fees Breakdown
        </h2>

        <div className="space-y-3">
          <SummaryRow
            label="Platform Fee (1.5%)"
            value={`$${platformFee.toFixed(2)}`}
            size="sm"
          />
          <SummaryRow
            label="Payment Processing"
            value={`$${paymentProcessingFee.toFixed(2)}`}
            size="sm"
          />

          <div className="border-t border-vaca-neutral-gray-200 pt-3">
            <SummaryRow
              label="Total Fees"
              value={`$${totalFees.toFixed(2)}`}
              valueClassName="text-vaca-neutral-gray-900 font-semibold"
            />
          </div>

          <div className="border-t-2 border-vaca-neutral-gray-300 pt-3">
            <SummaryRow
              label="Total to Pay"
              value={`$${totalAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              valueClassName="text-vaca-green font-playfair text-2xl font-semibold"
            />
          </div>
        </div>
      </motion.div>

      {/* Liquidity Rules Reminder */}
      <motion.div
        variants={itemVariants}
        className={cn(
          "rounded-2xl border-2 border-vaca-blue/20 bg-vaca-blue/5",
          "p-5",
        )}
      >
        <div className="flex gap-3">
          {/* Info Icon */}
          <div className="flex-shrink-0 pt-0.5">
            <svg
              className="h-5 w-5 text-vaca-blue"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div className="flex-1 space-y-2">
            <h3 className="font-inter text-sm font-semibold text-vaca-neutral-gray-900">
              Liquidity Rules
            </h3>
            <ul className="space-y-1.5 font-inter text-sm text-vaca-neutral-gray-700">
              <li className="flex gap-2">
                <span className="text-vaca-blue">•</span>
                <span>
                  Your shares will be locked during the production cycle
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-vaca-blue">•</span>
                <span>
                  Liquidity windows open periodically for share transfers
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-vaca-blue">•</span>
                <span>Final settlement occurs when cattle are sold</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl bg-vaca-neutral-gray-50 px-4 py-3"
      >
        <p className="text-center font-inter text-xs text-vaca-neutral-gray-600">
          <span className="font-semibold">Important:</span> Returns are not
          guaranteed. Cattle investment involves agricultural and market risks.
          Only invest amounts you can afford to tie up for the full cycle
          duration.
        </p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="flex flex-col gap-3 pt-2">
        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}
        <PrimaryButton
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t("processing")}
            </span>
          ) : (
            t("confirmButton")
          )}
        </PrimaryButton>

        <button
          onClick={handleBack}
          disabled={isSubmitting}
          className={cn(
            "w-full rounded-xl border-2 border-vaca-neutral-gray-200 bg-vaca-neutral-white",
            "px-6 py-4 font-inter text-base font-medium text-vaca-neutral-gray-700",
            "transition-all duration-200",
            "hover:border-vaca-neutral-gray-300 hover:bg-vaca-neutral-gray-50",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-vaca-neutral-gray-200",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {t("cancelButton")}
        </button>
      </motion.div>
    </motion.div>
  );
}

/**
 * SummaryRow Component
 * Reusable row for displaying label-value pairs
 */
interface SummaryRowProps {
  label: string;
  value: string;
  sublabel?: string;
  valueClassName?: string;
  size?: "sm" | "md";
}

function SummaryRow({
  label,
  value,
  sublabel,
  valueClassName,
  size = "md",
}: SummaryRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div className="flex-1">
        <div
          className={cn(
            "font-inter text-vaca-neutral-gray-600",
            size === "sm" ? "text-xs" : "text-sm",
          )}
        >
          {label}
        </div>
        {sublabel && (
          <div className="mt-0.5 text-xs text-vaca-neutral-gray-400">
            {sublabel}
          </div>
        )}
      </div>
      <div
        className={cn(
          "font-inter tabular-nums",
          size === "sm" ? "text-sm" : "text-base",
          valueClassName || "text-vaca-neutral-gray-900",
        )}
      >
        {value}
      </div>
    </div>
  );
}
