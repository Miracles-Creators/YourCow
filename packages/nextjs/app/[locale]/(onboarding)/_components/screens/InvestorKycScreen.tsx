"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "~~/lib/i18n/routing";
import { cn } from "~~/lib/utils/cn";
import {
  FileUploadCard,
  OnboardingShell,
  OnboardingSteps,
  shellItemVariants,
} from "~~/app/[locale]/(onboarding)/_components";
import { Button } from "~~/components/ui";

interface FormData {
  documentType: string;
  documentNumber: string;
  documentFront: File | null;
  documentBack: File | null;
}

interface FormErrors {
  documentType?: string;
  documentNumber?: string;
  documentFront?: string;
}

/**
 * InvestorKycScreen (ONB-INV-02)
 * KYC identity verification
 * Step 2 of 2 in investor onboarding
 */
export function InvestorKycScreen() {
  const t = useTranslations("onboarding.investorKyc");
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    documentType: "",
    documentNumber: "",
    documentFront: null,
    documentBack: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { label: t("steps.profile"), status: "completed" as const },
    { label: t("steps.verification"), status: "active" as const },
  ];

  const documentTypes = [
    { value: "", label: t("fields.documentType.placeholder") },
    { value: "national_id", label: t("fields.documentType.options.nationalId") },
    { value: "passport", label: t("fields.documentType.options.passport") },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.documentType) {
      newErrors.documentType = t("errors.documentTypeRequired");
    }

    if (!formData.documentNumber.trim()) {
      newErrors.documentNumber = t("errors.documentNumberRequired");
    }

    if (!formData.documentFront) {
      newErrors.documentFront = t("errors.documentFrontRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Mock API call - replace with actual KYC submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Navigate to completion screen
    router.push("/onboarding/complete");
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (field: "documentFront" | "documentBack") => (
    file: File | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
    if (field === "documentFront" && errors.documentFront) {
      setErrors((prev) => ({ ...prev, documentFront: undefined }));
    }
  };

  const isPassport = formData.documentType === "passport";

  return (
    <OnboardingShell>
      {/* Steps */}
      <motion.div variants={shellItemVariants} className="mb-8">
        <OnboardingSteps steps={steps} />
      </motion.div>

      {/* Header */}
      <motion.div variants={shellItemVariants} className="mb-6 text-center">
        <h1 className="font-playfair text-2xl font-semibold text-vaca-neutral-gray-900 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 font-inter text-sm text-vaca-neutral-gray-500">
          {t("subtitle")}
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        variants={shellItemVariants}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Identity Section */}
        <div className="space-y-4">
          {/* Document Type */}
          <div>
            <label
              htmlFor="documentType"
              className="mb-2 block font-inter text-sm font-medium text-vaca-neutral-gray-700"
            >
              {t("fields.documentType.label")}
            </label>
            <div className="relative">
              <select
                id="documentType"
                value={formData.documentType}
                onChange={handleInputChange("documentType")}
                disabled={isSubmitting}
                className={cn(
                  "w-full appearance-none rounded-xl border-2 px-4 py-3 pr-10 font-inter text-base transition-colors",
                  "bg-vaca-neutral-white text-vaca-neutral-gray-900",
                  "focus:outline-none focus:ring-0",
                  errors.documentType
                    ? "border-red-500 focus:border-red-500"
                    : "border-vaca-neutral-gray-200 focus:border-vaca-green",
                  "disabled:cursor-not-allowed disabled:bg-vaca-neutral-gray-100",
                )}
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  className="h-5 w-5 text-vaca-neutral-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            {errors.documentType && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {errors.documentType}
              </p>
            )}
          </div>

          {/* Document Number */}
          <div>
            <label
              htmlFor="documentNumber"
              className="mb-2 block font-inter text-sm font-medium text-vaca-neutral-gray-700"
            >
              {t("fields.documentNumber.label")}
            </label>
            <input
              id="documentNumber"
              type="text"
              placeholder={t("fields.documentNumber.placeholder")}
              value={formData.documentNumber}
              onChange={handleInputChange("documentNumber")}
              disabled={isSubmitting}
              className={cn(
                "w-full rounded-xl border-2 px-4 py-3 font-inter text-base transition-colors",
                "bg-vaca-neutral-white text-vaca-neutral-gray-900",
                "placeholder:text-vaca-neutral-gray-400",
                "focus:outline-none focus:ring-0",
                errors.documentNumber
                  ? "border-red-500 focus:border-red-500"
                  : "border-vaca-neutral-gray-200 focus:border-vaca-green",
                "disabled:cursor-not-allowed disabled:bg-vaca-neutral-gray-100",
              )}
            />
            {errors.documentNumber && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {errors.documentNumber}
              </p>
            )}
          </div>

          {/* Document Upload */}
          <FileUploadCard
            label={t("fields.documentFront.label")}
            helperText={t("fields.documentFront.helperText")}
            accept="image/*,.pdf"
            onFileSelect={handleFileChange("documentFront")}
            error={errors.documentFront}
          />

          {!isPassport && (
            <FileUploadCard
              label={t("fields.documentBack.label")}
              helperText={t("fields.documentBack.helperText")}
              accept="image/*,.pdf"
              onFileSelect={handleFileChange("documentBack")}
            />
          )}
        </div>

        {/* Compliance Note */}
        <p className="text-center font-inter text-xs text-vaca-neutral-gray-500">
          {t("complianceNote")}
        </p>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            colorScheme="neutral"
            variant="outline"
            size="lg"
            onClick={() => router.push("/onboarding/investor/profile")}
            disabled={isSubmitting}
            className="flex-1"
          >
            {t("buttons.back")}
          </Button>

          <Button
            type="submit"
            colorScheme="green"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            className="flex-1 hover:-translate-y-0.5 active:translate-y-0"
          >
            {isSubmitting ? t("buttons.submitting") : t("buttons.finish")}
          </Button>
        </div>
      </motion.form>
    </OnboardingShell>
  );
}
