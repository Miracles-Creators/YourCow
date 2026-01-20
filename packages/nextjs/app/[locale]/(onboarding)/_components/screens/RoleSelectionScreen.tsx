"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "~~/lib/i18n/routing";
import {
  OnboardingShell,
  shellItemVariants,
  SelectableRoleCard,
} from "~~/app/[locale]/(onboarding)/_components";
import { Button, Card } from "~~/components/ui";

type Role = "investor" | "producer" | null;

// Icons for role cards
const InvestorIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
    />
  </svg>
);

const ProducerIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
    />
  </svg>
);

/**
 * RoleSelectionScreen (ONB-02)
 * Role selection - Investor or Producer
 * Routes to appropriate onboarding flow based on selection
 */
export function RoleSelectionScreen() {
  const t = useTranslations("onboarding.roleSelection");
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleContinue = () => {
    if (selectedRole === "investor") {
      router.push("/onboarding/investor/profile");
    } else if (selectedRole === "producer") {
      router.push("/onboarding/producer/profile");
    }
  };

  return (
    <>
      <OnboardingShell>
        {/* Header */}
        <motion.div variants={shellItemVariants} className="mb-8 text-center">
          <h1 className="font-playfair text-2xl font-semibold text-vaca-neutral-gray-900 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 font-inter text-base text-vaca-neutral-gray-500">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Role Cards */}
        <motion.div
          variants={shellItemVariants}
          className="space-y-4"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <SelectableRoleCard
              title={t("roles.investor.title")}
              description={t("roles.investor.description")}
              icon={<InvestorIcon />}
              accent="green"
              isSelected={selectedRole === "investor"}
              onSelect={() => setSelectedRole("investor")}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <SelectableRoleCard
              title={t("roles.producer.title")}
              description={t("roles.producer.description")}
              icon={<ProducerIcon />}
              accent="blue"
              isSelected={selectedRole === "producer"}
              onSelect={() => setSelectedRole("producer")}
            />
          </motion.div>
        </motion.div>

        {/* Continue Button */}
        <motion.div variants={shellItemVariants} className="mt-8">
          <Button
            colorScheme="green"
            variant="primary"
            size="lg"
            fullWidth
            disabled={!selectedRole}
            onClick={handleContinue}
            className="hover:-translate-y-0.5 active:translate-y-0"
          >
            {t("buttons.continue")}
          </Button>
        </motion.div>

        {/* Not sure link */}
        <motion.p
          variants={shellItemVariants}
          className="mt-4 text-center"
        >
          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="font-inter text-sm text-vaca-neutral-gray-500 underline-offset-2 hover:text-vaca-green hover:underline"
          >
            {t("notSure")}
          </button>
        </motion.p>
      </OnboardingShell>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-vaca-neutral-gray-900/50 p-4"
            onClick={() => setShowInfoModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card
                variant="elevated"
                padding="lg"
                className="rounded-2xl shadow-xl"
              >
                <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
                  {t("modal.title")}
                </h2>

                <div className="mt-4 space-y-4">
                  <Card
                    variant="default"
                    padding="sm"
                    className="bg-vaca-green/5"
                  >
                    <h3 className="font-inter text-sm font-semibold text-vaca-green">
                      {t("roles.investor.title")}
                    </h3>
                    <p className="mt-1 font-inter text-sm text-vaca-neutral-gray-600">
                      {t("modal.investorDescription")}
                    </p>
                  </Card>

                  <Card
                    variant="default"
                    padding="sm"
                    className="bg-vaca-blue/5"
                  >
                    <h3 className="font-inter text-sm font-semibold text-vaca-blue-dark">
                      {t("roles.producer.title")}
                    </h3>
                    <p className="mt-1 font-inter text-sm text-vaca-neutral-gray-600">
                      {t("modal.producerDescription")}
                    </p>
                  </Card>
                </div>

                <Button
                  colorScheme="neutral"
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() => setShowInfoModal(false)}
                  className="mt-6"
                >
                  {t("modal.close")}
                </Button>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
