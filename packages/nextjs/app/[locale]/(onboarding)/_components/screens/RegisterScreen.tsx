"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "~~/lib/i18n/routing";
import { cn } from "~~/lib/utils/cn";
import {
  FormRow,
  OnboardingShell,
  shellItemVariants,
} from "~~/app/[locale]/(onboarding)/_components";
import { Button } from "~~/components/ui";
import { useOnboardingStore } from "~~/services/store/onboarding";

interface FormData {
  fullName: string;
  email: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
}

/**
 * RegisterScreen (ONB-01)
 * Minimal friction account creation
 * Collects name and email, then redirects to role selection
 */
export function RegisterScreen() {
  const t = useTranslations("onboarding.register");
  const router = useRouter();
  const updateRegister = useOnboardingStore((state) => state.updateRegister);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t("errors.fullNameRequired");
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = t("errors.fullNameTooShort");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("errors.emailInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    updateRegister({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
    });

    // Mock API call - replace with actual registration
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Navigate to role selection
    router.push("/onboarding/role");
  };

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <OnboardingShell>
      {/* Logo */}
      <motion.div variants={shellItemVariants} className="mb-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-vaca-green/10">
          <svg
            className="h-8 w-8 text-vaca-green"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div variants={shellItemVariants} className="mb-8 text-center">
        <h1 className="font-playfair text-2xl font-semibold text-vaca-neutral-gray-900 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 font-inter text-base text-vaca-neutral-gray-500">
          {t("subtitle")}
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        variants={shellItemVariants}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <FormRow
          label={t("fields.fullName.label")}
          placeholder={t("fields.fullName.placeholder")}
          value={formData.fullName}
          onChange={handleChange("fullName")}
          error={errors.fullName}
          autoComplete="name"
          disabled={isSubmitting}
        />

        <FormRow
          label={t("fields.email.label")}
          type="email"
          placeholder={t("fields.email.placeholder")}
          value={formData.email}
          onChange={handleChange("email")}
          error={errors.email}
          helperText={t("fields.email.helperText")}
          autoComplete="email"
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          colorScheme="green"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSubmitting || !formData.fullName || !formData.email}
          className={cn(
            "mt-6",
            "hover:-translate-y-0.5 active:translate-y-0",
          )}
        >
          {isSubmitting ? t("buttons.submitting") : t("buttons.continue")}
        </Button>
      </motion.form>

      {/* Sign in link */}
      <motion.p
        variants={shellItemVariants}
        className="mt-6 text-center font-inter text-sm text-vaca-neutral-gray-500"
      >
        {t("signIn.text")}{" "}
        <Link
          href="/login"
          className="font-medium text-vaca-green hover:text-vaca-green-light"
        >
          {t("signIn.link")}
        </Link>
      </motion.p>
    </OnboardingShell>
  );
}
