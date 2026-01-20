"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  OnboardingShell,
  shellItemVariants,
} from "~~/app/[locale]/(onboarding)/_components";
import { Button, Card } from "~~/components/ui";

interface OnboardingCompleteScreenProps {
  /** Role determines the messaging and CTA destination */
  role?: "investor" | "producer";
}

/**
 * OnboardingCompleteScreen (ONB-03)
 * Success confirmation after onboarding completion
 * Role-aware messaging and routing
 */
export function OnboardingCompleteScreen({
  role = "investor",
}: OnboardingCompleteScreenProps) {
  const t = useTranslations("onboarding.complete");

  const isInvestor = role === "investor";

  return (
    <OnboardingShell>
      {/* Success Icon */}
      <motion.div
        variants={shellItemVariants}
        className="mb-8 flex justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-vaca-green/10"
        >
          <motion.svg
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="h-10 w-10 text-vaca-green"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </motion.svg>
        </motion.div>
      </motion.div>

      {/* Header */}
      <motion.div variants={shellItemVariants} className="mb-8 text-center">
        <h1 className="font-playfair text-2xl font-semibold text-vaca-neutral-gray-900 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-3 font-inter text-base text-vaca-neutral-gray-500">
          {isInvestor ? t("investor.subtitle") : t("producer.subtitle")}
        </p>
      </motion.div>

      {/* What's next */}
      <motion.div variants={shellItemVariants} className="mb-8">
        <Card
          variant="bordered"
          padding="sm"
          className="bg-vaca-neutral-gray-50/50"
        >
          <h2 className="mb-3 font-inter text-sm font-semibold text-vaca-neutral-gray-700">
            {t("whatsNext.title")}
          </h2>
          <ul className="space-y-2">
            {isInvestor ? (
              <>
                <li className="flex items-start gap-2 font-inter text-sm text-vaca-neutral-gray-600">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-vaca-green text-[10px] font-bold text-vaca-neutral-white">
                    1
                  </span>
                  {t("investor.step1")}
                </li>
                <li className="flex items-start gap-2 font-inter text-sm text-vaca-neutral-gray-600">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-vaca-green text-[10px] font-bold text-vaca-neutral-white">
                    2
                  </span>
                  {t("investor.step2")}
                </li>
                <li className="flex items-start gap-2 font-inter text-sm text-vaca-neutral-gray-600">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-vaca-green text-[10px] font-bold text-vaca-neutral-white">
                    3
                  </span>
                  {t("investor.step3")}
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2 font-inter text-sm text-vaca-neutral-gray-600">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-vaca-blue text-[10px] font-bold text-vaca-neutral-white">
                    1
                  </span>
                  {t("producer.step1")}
                </li>
                <li className="flex items-start gap-2 font-inter text-sm text-vaca-neutral-gray-600">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-vaca-blue text-[10px] font-bold text-vaca-neutral-white">
                    2
                  </span>
                  {t("producer.step2")}
                </li>
                <li className="flex items-start gap-2 font-inter text-sm text-vaca-neutral-gray-600">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-vaca-blue text-[10px] font-bold text-vaca-neutral-white">
                    3
                  </span>
                  {t("producer.step3")}
                </li>
              </>
            )}
          </ul>
        </Card>
      </motion.div>

      {/* Primary CTA */}
      <motion.div variants={shellItemVariants}>
        <Button
          href={isInvestor ? "/marketplace" : "/producer"}
          colorScheme={isInvestor ? "green" : "blue"}
          variant="primary"
          size="lg"
          fullWidth
          className="hover:-translate-y-0.5 active:translate-y-0"
        >
          {isInvestor ? t("investor.cta") : t("producer.cta")}
        </Button>
      </motion.div>

      {/* Support link */}
      <motion.p
        variants={shellItemVariants}
        className="mt-6 text-center"
      >
        <a
          href="mailto:support@yourcow.com"
          className="font-inter text-sm text-vaca-neutral-gray-500 underline-offset-2 hover:text-vaca-green hover:underline"
        >
          {t("supportLink")}
        </a>
      </motion.p>
    </OnboardingShell>
  );
}
