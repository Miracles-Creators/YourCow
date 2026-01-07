"use client";

import { motion } from "framer-motion";
import { useTranslations } from 'next-intl';
import { Logo } from "../ui/Logo";
import { PrimaryButton } from "../ui/PrimaryButton";
import { TrustBadge } from "../ui/TrustBadge";

/**
 * WelcomeScreen (INV-01)
 * First touchpoint for retail investors
 * Establishes trust, clarity, and agricultural authenticity
 */
export function WelcomeScreen() {
  const t = useTranslations('investor.welcome');

  // Staggered animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center text-center"
    >
      {/* Logo Section */}
      <motion.div variants={itemVariants}>
        <Logo size="lg" className="mb-12 sm:mb-16" />
      </motion.div>

      {/* Headline & Tagline */}
      <motion.div variants={itemVariants} className="mb-12 space-y-4">
        <h2 className="font-playfair text-3xl font-semibold leading-tight tracking-tight text-vaca-neutral-gray-900 sm:text-4xl">
          {t('tagline')}
        </h2>
        <p className="mx-auto max-w-md font-inter text-base leading-relaxed text-vaca-neutral-gray-500 sm:text-lg">
          {t('description')}
        </p>
      </motion.div>

      {/* Primary CTA */}
      <motion.div variants={itemVariants} className="mb-12">
        <PrimaryButton href="/login" size="lg">
          {t('cta')}
        </PrimaryButton>
      </motion.div>

      {/* Trust Indicator */}
      <motion.div variants={itemVariants}>
        <TrustBadge />
      </motion.div>
    </motion.div>
  );
}
