"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { useLot } from "~~/hooks/lots/useLot";
import { cn } from "~~/lib/utils/cn";
import { slowContainerVariants, slowItemVariants } from "../animations";

interface InvestmentSuccessScreenProps {
  lotId: number;
  investmentAmount: number;
  shares: number;
}

export function InvestmentSuccessScreen({
  lotId,
  investmentAmount,
  shares,
}: InvestmentSuccessScreenProps) {
  const t = useTranslations("investor.investmentSuccess");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const { data: lot, isPending } = useLot(lotId);

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

  const investorPercent = lot.investorPercent ?? 0;
  const estimatedReturn = Math.round(investmentAmount * (investorPercent / 100));

  return (
    <motion.div
      variants={slowContainerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto flex max-w-[430px] flex-col items-center px-7 pt-12 lg:max-w-2xl lg:px-10"
    >
      {/* Animated checkmark */}
      <motion.div variants={slowItemVariants} className="mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-vaca-green/10"
        >
          <svg
            className="h-12 w-12"
            viewBox="0 0 48 48"
            fill="none"
          >
            <motion.path
              d="M12 24 L20 32 L36 16"
              stroke="#1B5E20"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: { duration: 0.6, delay: 0.3, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.2, delay: 0.3 },
              }}
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.div variants={slowItemVariants} className="mb-8 text-center">
        <h1 className="font-playfair text-3xl leading-tight text-vaca-green">
          {t("title")}
        </h1>
        <p className="mt-2 font-inter text-sm text-vaca-neutral-gray-500">
          {t("message", { lotName: lot.name })}
        </p>
      </motion.div>

      {/* Investment card */}
      <motion.div
        variants={slowItemVariants}
        className="mb-8 w-full rounded-2xl border border-vaca-green/10 bg-vaca-green/5 p-5"
      >
        {/* Lot info */}
        <div className="mb-4 text-center">
          <h2 className="font-playfair text-lg font-semibold text-vaca-neutral-gray-900">
            {lot.name}
          </h2>
          <p className="mt-0.5 font-inter text-xs text-vaca-neutral-gray-400">
            {lot.location} · {lot.durationWeeks ? `${lot.durationWeeks} ${tCommon("time.weeks")}` : ""}
          </p>
        </div>

        <div className="border-t border-vaca-green/10" />

        {/* Metrics grid */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
              {t("details.invested")}
            </p>
            <p className="mt-1 font-inter text-2xl font-bold text-vaca-neutral-gray-900">
              ${investmentAmount.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
              {t("details.shares")}
            </p>
            <p className="mt-1 font-inter text-2xl font-bold text-vaca-neutral-gray-900">
              {shares.toLocaleString()}
            </p>
          </div>
        </div>

        {investorPercent > 0 && (
          <>
            <div className="mt-4 border-t border-vaca-green/10" />
            <div className="mt-4 text-center">
              <p className="font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
                Est. Return ({investorPercent}%)
              </p>
              <p className="mt-1 font-inter text-xl font-bold text-vaca-green">
                +${estimatedReturn.toLocaleString()}
              </p>
            </div>
          </>
        )}

        {/* Active badge */}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-vaca-green/10 py-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vaca-green opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-vaca-green" />
          </span>
          <span className="font-inter text-xs font-bold text-vaca-green">
            {tCommon("status.active")}
          </span>
        </div>
      </motion.div>

      {/* Next steps */}
      <motion.div variants={slowItemVariants} className="mb-8 w-full">
        <h3 className="mb-3 text-center font-inter text-xs font-bold uppercase tracking-[0.15em] text-vaca-neutral-gray-400">
          {t("nextSteps.title")}
        </h3>
        <div className="space-y-2">
          {["step1", "step2", "step3"].map((step) => (
            <div key={step} className="flex items-start gap-2.5">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-vaca-green" />
              <span className="font-inter text-sm text-vaca-neutral-gray-600">
                {t(`nextSteps.${step}`)}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div variants={slowItemVariants} className="w-full space-y-3 pb-8">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/dashboard")}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-vaca-green to-vaca-green-light font-inter text-base font-bold text-white shadow-xl shadow-vaca-green/30 transition-all"
        >
          {t("actions.viewPortfolio")}
        </motion.button>
        <button
          onClick={() => router.push(`/lot/${lotId}`)}
          className="w-full py-3 font-inter text-sm font-medium text-vaca-neutral-gray-500 transition-colors hover:text-vaca-neutral-gray-700"
        >
          {t("actions.viewPosition")}
        </button>
      </motion.div>
    </motion.div>
  );
}
