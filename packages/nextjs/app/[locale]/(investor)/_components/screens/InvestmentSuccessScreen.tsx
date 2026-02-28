"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLot } from "~~/hooks/lots/useLot";
import { cn } from "~~/lib/utils/cn";
import { PrimaryButton } from "../ui/PrimaryButton";
import { slowContainerVariants, slowItemVariants } from "../animations";

interface InvestmentSuccessScreenProps {
  lotId: number;
  investmentAmount: number;
  shares: number;
}

/**
 * InvestmentSuccessScreen (INV-12)
 * Success confirmation after investment is processed
 *
 * Shows:
 * - Confirmation message
 * - Lot name
 * - Status: Active
 * - Button: View Portfolio
 *
 * Style: Green success tone, subtle animation
 */
export function InvestmentSuccessScreen({
  lotId,
  investmentAmount,
  shares,
}: InvestmentSuccessScreenProps) {
  const t = useTranslations("investor.investmentSuccess");
  const tCommon = useTranslations("common");

  const router = useRouter();
  const { data: lotData, isPending } = useLot(lotId);
  const lot = lotData ?? null;
  const fallbackText = "sin back-end";

  const handleViewPortfolio = () => {
    router.push("/dashboard");
  };

  const handleViewLot = () => {
    router.push(`/lot/${lotId}`);
  };

  const checkmarkVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0,
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: {
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1] as const,
        },
        opacity: {
          duration: 0.2,
        },
      },
    },
  };

  const circleVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.34, 1.56, 0.64, 1] as const, // Spring-like easing
      },
    },
  };

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
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={slowContainerVariants}
      initial="hidden"
      animate="visible"
      className="flex w-full flex-col items-center"
    >
      {/* Success Icon */}
      <motion.div
        variants={slowItemVariants}
        className="mb-6 flex h-24 w-24 items-center justify-center"
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Circle */}
          <motion.circle
            variants={circleVariants}
            cx="50"
            cy="50"
            r="45"
            fill="#1B5E20"
            fillOpacity="0.1"
          />
          <motion.circle
            variants={circleVariants}
            cx="50"
            cy="50"
            r="40"
            stroke="#1B5E20"
            strokeWidth="3"
            fill="none"
          />
          {/* Checkmark */}
          <motion.path
            variants={checkmarkVariants}
            d="M30 50 L42 62 L70 38"
            stroke="#1B5E20"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </motion.div>

      {/* Success Message */}
      <motion.div variants={slowItemVariants} className="mb-8 text-center">
        <h1 className="mb-2 font-playfair text-3xl font-semibold tracking-tight text-vaca-green">
          {t("title")}
        </h1>
        <p className="font-inter text-base text-vaca-neutral-gray-600">
          {t("message", { lotName: lot?.name || fallbackText })}
        </p>
      </motion.div>

      {/* Investment Details Card */}
      <motion.div
        variants={slowItemVariants}
        className={cn(
          "mb-8 w-full rounded-2xl border-2 border-vaca-green/20 bg-vaca-green/5",
          "p-6",
        )}
      >
        <div className="space-y-4">
          {/* Lot Name */}
          <div className="text-center">
            <div className="mb-1 font-inter text-xs font-medium uppercase tracking-wide text-vaca-green/70">
              {t("details.lot")}
            </div>
            <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
              {lot?.name || fallbackText}
            </h2>
            <div className="mt-1 font-inter text-sm text-vaca-neutral-gray-600">
              {lot?.location || fallbackText} ·{" "}
              {lot?.durationWeeks
                ? `${lot.durationWeeks} weeks`
                : fallbackText}
            </div>
          </div>

          <div className="border-t border-vaca-green/10" />

          {/* Investment Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="mb-1 font-inter text-xs text-vaca-neutral-gray-500">
                {t("details.invested")}
              </div>
              <div className="font-playfair text-2xl font-semibold text-vaca-green">
                ${investmentAmount.toLocaleString("en-US")}
              </div>
            </div>
            <div className="text-center">
              <div className="mb-1 font-inter text-xs text-vaca-neutral-gray-500">
                {t("details.shares")}
              </div>
              <div className="font-playfair text-2xl font-semibold text-vaca-green">
                {shares.toLocaleString("en-US")}
              </div>
            </div>
          </div>

          <div className="border-t border-vaca-green/10" />

          {/* Status Badge */}
          <div className="flex items-center justify-center gap-2 rounded-xl bg-vaca-green/10 px-4 py-3">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vaca-green opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-vaca-green"></span>
            </div>
            <span className="font-inter text-sm font-semibold text-vaca-green">
              {tCommon("status.active")}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div variants={slowItemVariants} className="mb-8 w-full text-center">
        <h3 className="mb-3 font-inter text-sm font-semibold text-vaca-neutral-gray-900">
          {t("nextSteps.title")}
        </h3>
        <ul className="space-y-2 font-inter text-sm text-vaca-neutral-gray-600">
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-vaca-green"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-left">{t("nextSteps.step1")}</span>
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-vaca-green"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-left">{t("nextSteps.step2")}</span>
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-vaca-green"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-left">{t("nextSteps.step3")}</span>
          </li>
        </ul>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        variants={slowItemVariants}
        className="flex w-full flex-col gap-3"
      >
        <PrimaryButton onClick={handleViewPortfolio} className="w-full">
          {t("actions.viewPortfolio")}
        </PrimaryButton>

        <button
          onClick={handleViewLot}
          className={cn(
            "w-full rounded-xl border-2 border-vaca-neutral-gray-200 bg-vaca-neutral-white",
            "px-6 py-4 font-inter text-base font-medium text-vaca-neutral-gray-700",
            "transition-all duration-200",
            "hover:border-vaca-neutral-gray-300 hover:bg-vaca-neutral-gray-50",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-vaca-neutral-gray-200",
          )}
        >
          {t("actions.viewPosition")}
        </button>
      </motion.div>
    </motion.div>
  );
}
