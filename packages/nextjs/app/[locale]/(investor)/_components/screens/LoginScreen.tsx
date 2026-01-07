"use client";

import { motion } from "framer-motion";
import { useRouter } from "~~/lib/i18n/routing";
import { useTranslations } from 'next-intl';
import { useState } from "react";
import { cn } from "~~/lib/utils/cn";
import { Logo } from "../ui/Logo";
import { PrimaryButton } from "../ui/PrimaryButton";

/**
 * LoginScreen (INV-02)
 * Passwordless email authentication
 * Simple, secure, non-intimidating
 * Redirects to dashboard after successful login
 */
export function LoginScreen() {
  const t = useTranslations('investor.login');
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Integrate with real authentication service
    console.log("Email submitted:", email);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Redirect to dashboard after successful login
    router.push("/dashboard");
  };

  // Staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center"
    >
      {/* Logo */}
      <motion.div variants={itemVariants}>
        <Logo size="md" className="mb-8" />
      </motion.div>

      {/* Form */}
      <motion.form
        variants={itemVariants}
        onSubmit={handleSubmit}
        className="w-full space-y-6"
      >
        {/* Email Input */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="sr-only"
          >
            {t('emailLabel')}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className={cn(
              "w-full rounded-xl border-2 border-vaca-neutral-gray-200 bg-vaca-neutral-white px-4 py-4",
              "font-inter text-base text-vaca-neutral-gray-900 placeholder:text-vaca-neutral-gray-300",
              "transition-all duration-200",
              "focus:border-vaca-green focus:outline-none focus:ring-4 focus:ring-vaca-green/10",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            aria-label={t('emailLabel')}
          />
        </div>

        {/* Submit Button */}
        <PrimaryButton
          type="submit"
          disabled={isSubmitting || !email}
          className="w-full"
        >
          {isSubmitting ? t('sendingButton') : t('continueButton')}
        </PrimaryButton>
      </motion.form>

      {/* Helper Text */}
      <motion.p
        variants={itemVariants}
        className="mt-6 font-inter text-sm text-vaca-neutral-gray-400"
      >
        {t('helperText')}
      </motion.p>
    </motion.div>
  );
}
