"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowLeft, Lock, CheckCircle, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLot } from "~~/hooks/lots/useLot";
import { useMe } from "~~/hooks/auth/useMe";
import { useCreatePayment } from "~~/hooks/payments/useCreatePayment";
import { useConfirmPayment } from "~~/hooks/payments/useConfirmPayment";
import { useFiatDeposit } from "~~/hooks/payments/useFiatDeposit";
import { useBuyPrimary } from "~~/hooks/marketplace";
import { cn } from "~~/lib/utils/cn";
import { containerVariants, itemVariants } from "../animations";

type Step = 0 | 1 | 2 | 3 | 4;

interface ConfirmInvestmentScreenProps {
  lotId: number;
  investmentAmount: number;
  shares: number;
}

export function ConfirmInvestmentScreen({
  lotId,
  investmentAmount,
  shares,
}: ConfirmInvestmentScreenProps) {
  const t = useTranslations("investor.confirmInvestment");
  const tCommon = useTranslations("common");

  const STEPS = [
    t("steps.registeringPayment"),
    t("steps.confirmingPayment"),
    t("steps.mintingShares"),
  ];
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { data: lot, isPending } = useLot(lotId);
  const { data: me } = useMe();
  const createPayment = useCreatePayment();
  const confirmPayment = useConfirmPayment();
  const fiatDeposit = useFiatDeposit();
  const buyPrimary = useBuyPrimary();

  const platformFee = investmentAmount * 0.015;
  const paymentProcessingFee = investmentAmount * 0.029 + 0.3;
  const totalFees = platformFee + paymentProcessingFee;
  const totalAmount = investmentAmount + totalFees;
  const investorPercent = lot?.investorPercent ?? 0;
  const estimatedReturn = Math.round(
    investmentAmount * (investorPercent / 100),
  );

  const handleConfirm = async () => {
    if (!lot || !me?.id) {
      setErrorMessage("Missing lot or investor data.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setCurrentStep(1);

    try {
      const payment = await createPayment.mutateAsync({
        paymentIntentId: `mock_${Date.now()}`,
        investorId: me.id,
        lotId: lot.id,
        amountFiat: Math.round(investmentAmount * 100),
        currency: "ARS",
      });

      setCurrentStep(2);
      await confirmPayment.mutateAsync({ id: payment.id });

      setCurrentStep(3);
      await fiatDeposit.mutateAsync({ id: payment.id });

      setCurrentStep(4);
      const result = await buyPrimary.mutateAsync({
        lotId: lot.id,
        sharesAmount: shares,
        idempotencyKey: `primary_${payment.id}`,
      });

      setTxHash(result.txHash);

      router.push(
        `/investment-success/${lot.id}?amount=${investmentAmount}&shares=${shares}&txHash=${result.txHash}`,
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong. Please try again.");
      setIsSubmitting(false);
      setCurrentStep(0);
    }
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
        <h2 className="font-playfair text-2xl font-semibold text-vaca-neutral-gray-900">
          {tCommon("errors.notFound")}
        </h2>
      </div>
    );
  }

  const ctaButtons = (
    <>
      <AnimatePresence mode="wait">
        {isSubmitting ? (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="w-full rounded-2xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white px-5 py-4 shadow-sm"
          >
            <p className="mb-3 font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
              {t("progressTitle")}
            </p>

            <div className="space-y-3">
              {STEPS.map((label, i) => {
                // map UI step index to internal currentStep values
                // UI: 0=registeringPayment(1), 1=confirmingPayment(2), 2=mintingShares(3+4)
                const uiStepStart = i === 2 ? 3 : i + 1;
                const isDone = i === 2 ? currentStep > 4 : currentStep > uiStepStart;
                const isActive = i === 2 ? currentStep === 3 || currentStep === 4 : currentStep === uiStepStart;
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                      {isDone ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CheckCircle className="h-5 w-5 text-vaca-green" />
                        </motion.div>
                      ) : isActive ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-vaca-green/20 border-t-vaca-green" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-vaca-neutral-gray-200" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "font-inter text-sm transition-colors",
                        isDone
                          ? "text-vaca-green"
                          : isActive
                            ? "font-medium text-vaca-neutral-gray-900"
                            : "text-vaca-neutral-gray-300",
                      )}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <AnimatePresence>
              {txHash && (
                <motion.a
                  key="txlink"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  href={`https://sepolia.voyager.online/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-vaca-sky/30 bg-vaca-sky/5 px-4 py-2.5 font-inter text-sm font-medium text-vaca-sky transition-colors hover:bg-vaca-sky/10"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t("viewTransaction")}
                </motion.a>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.button
            key="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-vaca-green to-vaca-green-light font-inter text-base font-bold text-white shadow-xl shadow-vaca-green/30 transition-all"
          >
            <Lock className="h-4 w-4" />
            {t("confirmButton")}
          </motion.button>
        )}
      </AnimatePresence>

      <button
        onClick={() => router.back()}
        disabled={isSubmitting}
        className="mt-2 w-full py-3 font-inter text-sm font-medium text-vaca-neutral-gray-500 transition-colors hover:text-vaca-neutral-gray-700 disabled:opacity-50"
      >
        {t("cancelButton")}
      </button>
    </>
  );

  return (
    <div className="relative pb-36 lg:pb-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-[430px] px-7 pt-4 lg:max-w-xl lg:px-0 lg:pt-10"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8 lg:mb-6">
          <button
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center gap-2 font-inter text-sm text-vaca-neutral-gray-500 transition-colors hover:text-vaca-green"
          >
            <ArrowLeft className="h-4 w-4" />
            {tCommon("actions.back")}
          </button>
          <h1 className="font-playfair text-2xl leading-tight text-vaca-neutral-gray-900 lg:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 font-inter text-sm text-vaca-neutral-gray-400">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Desktop card wrapper */}
        <div className="lg:rounded-2xl lg:border lg:border-vaca-neutral-gray-100 lg:bg-vaca-neutral-white lg:p-8">
          {/* Investment Summary */}
          <motion.div
            variants={itemVariants}
            className="mb-4 rounded-2xl border border-vaca-neutral-gray-50 bg-vaca-neutral-white p-5 shadow-sm lg:border-vaca-neutral-gray-100 lg:bg-vaca-neutral-bg lg:shadow-none"
          >
            <p className="mb-4 font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
              Investment Summary
            </p>

            <div className="mb-4">
              <h2 className="font-playfair text-lg font-semibold text-vaca-neutral-gray-900">
                {lot.name}
              </h2>
              <p className="mt-0.5 font-inter text-xs text-vaca-neutral-gray-400">
                {lot.location} ·{" "}
                {lot.durationWeeks
                  ? `${lot.durationWeeks} ${tCommon("time.weeks")}`
                  : "—"}
              </p>
            </div>

            <div className="space-y-2.5">
              <SummaryRow
                label={t("investmentAmount")}
                value={`$${investmentAmount.toLocaleString()}`}
              />
              <SummaryRow
                label={t("shares")}
                value={`${shares.toLocaleString()} shares`}
              />
              <SummaryRow
                label={t("pricePerShare")}
                value={`$${lot.pricePerShare}`}
              />
            </div>

            {investorPercent > 0 && (
              <div className="mt-4 rounded-xl bg-vaca-green/5 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-inter text-xs text-vaca-neutral-gray-600">
                    Est. Return ({investorPercent}%)
                  </span>
                  <span className="font-inter text-lg font-bold text-vaca-green">
                    +${estimatedReturn.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Fees */}
          <motion.div
            variants={itemVariants}
            className="mb-4 rounded-2xl border border-vaca-neutral-gray-50 bg-vaca-neutral-white p-5 shadow-sm lg:border-vaca-neutral-gray-100 lg:bg-vaca-neutral-bg lg:shadow-none"
          >
            <p className="mb-4 font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
              Fees
            </p>
            <div className="space-y-2.5">
              <SummaryRow
                label="Platform (1.5%)"
                value={`$${platformFee.toFixed(2)}`}
                muted
              />
              <SummaryRow
                label="Processing"
                value={`$${paymentProcessingFee.toFixed(2)}`}
                muted
              />
              <div className="border-t border-vaca-neutral-gray-50 pt-2.5">
                <SummaryRow
                  label="Total Fees"
                  value={`$${totalFees.toFixed(2)}`}
                />
              </div>
            </div>
          </motion.div>

          {/* Total */}
          <motion.div
            variants={itemVariants}
            className="mb-6 rounded-2xl bg-vaca-neutral-gray-900 p-5"
          >
            <div className="flex items-center justify-between">
              <span className="font-inter text-xs font-semibold uppercase tracking-wider text-vaca-neutral-gray-400">
                Total to Pay
              </span>
              <span className="font-inter text-2xl font-bold tabular-nums text-white">
                $
                {totalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </motion.div>

          {/* Disclaimer */}
          <motion.div variants={itemVariants}>
            <p className="text-center font-inter text-[10px] leading-relaxed text-vaca-neutral-gray-400">
              Returns are not guaranteed. Cattle investment involves
              agricultural and market risks. Only invest amounts you can afford
              to tie up for the full cycle duration.
            </p>
          </motion.div>

          {/* Error */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl border border-vaca-error/20 bg-vaca-error-light px-4 py-3 text-center font-inter text-sm text-vaca-error"
            >
              {errorMessage}
            </motion.div>
          )}

          {/* CTA — desktop only (inline inside card) */}
          <motion.div variants={itemVariants} className="hidden pt-6 lg:block">
            {ctaButtons}
          </motion.div>
        </div>
      </motion.div>

      {/* Fixed Bottom CTA — mobile only */}
      <div className="fixed bottom-[4.5rem] left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 lg:hidden">
        <div className="bg-gradient-to-t from-vaca-neutral-white via-vaca-neutral-white to-vaca-neutral-white/0 px-7 pb-3 pt-4">
          {ctaButtons}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          "font-inter text-xs",
          muted ? "text-vaca-neutral-gray-400" : "text-vaca-neutral-gray-500",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-inter text-sm tabular-nums",
          muted
            ? "text-vaca-neutral-gray-500"
            : "font-semibold text-vaca-neutral-gray-900",
        )}
      >
        {value}
      </span>
    </div>
  );
}
