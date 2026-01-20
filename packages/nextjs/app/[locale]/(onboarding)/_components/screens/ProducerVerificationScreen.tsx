"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "~~/lib/i18n/routing";
import { cn } from "~~/lib/utils/cn";
import {
  FileUploadCard,
  FormRow,
  OnboardingShell,
  OnboardingSteps,
  shellItemVariants,
} from "~~/app/[locale]/(onboarding)/_components";
import { Button, Card } from "~~/components/ui";

interface FormData {
  senasaNumber: string;
  taxId: string;
  registrationProof: File | null;
  ownershipProof: File | null;
  insurance: File | null;
}

interface FormErrors {
  senasaNumber?: string;
  registrationProof?: string;
  ownershipProof?: string;
}

/**
 * ProducerVerificationScreen (ONB-PROD-02)
 * SENASA registration and document verification
 * Step 2 of 2 in producer onboarding
 */
export function ProducerVerificationScreen() {
  const t = useTranslations("onboarding.producerVerification");
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    senasaNumber: "",
    taxId: "",
    registrationProof: null,
    ownershipProof: null,
    insurance: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { label: t("steps.farm"), status: "completed" as const },
    { label: t("steps.verification"), status: "active" as const },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.senasaNumber.trim()) {
      newErrors.senasaNumber = t("errors.senasaRequired");
    }

    if (!formData.registrationProof) {
      newErrors.registrationProof = t("errors.registrationProofRequired");
    }

    if (!formData.ownershipProof) {
      newErrors.ownershipProof = t("errors.ownershipProofRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Mock API call - replace with actual verification submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Navigate to completion screen
    router.push("/onboarding/complete");
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (field: "registrationProof" | "ownershipProof" | "insurance") => (
    file: File | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

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
        className="space-y-5"
      >
        {/* Registration Numbers */}
        <div className="space-y-4">
          <FormRow
            label={t("fields.senasaNumber.label")}
            placeholder={t("fields.senasaNumber.placeholder")}
            value={formData.senasaNumber}
            onChange={handleInputChange("senasaNumber")}
            error={errors.senasaNumber}
            disabled={isSubmitting}
          />

          <FormRow
            label={t("fields.taxId.label")}
            placeholder={t("fields.taxId.placeholder")}
            value={formData.taxId}
            onChange={handleInputChange("taxId")}
            optional
            disabled={isSubmitting}
          />
        </div>

        {/* Document Uploads */}
        <div className="space-y-4">
          <h2 className="font-inter text-sm font-semibold uppercase tracking-wider text-vaca-neutral-gray-600">
            {t("sections.documents")}
          </h2>

          <FileUploadCard
            label={t("fields.registrationProof.label")}
            helperText={t("fields.registrationProof.helperText")}
            accept="image/*,.pdf"
            onFileSelect={handleFileChange("registrationProof")}
            error={errors.registrationProof}
          />

          <FileUploadCard
            label={t("fields.ownershipProof.label")}
            helperText={t("fields.ownershipProof.helperText")}
            accept="image/*,.pdf"
            onFileSelect={handleFileChange("ownershipProof")}
            error={errors.ownershipProof}
          />

          <FileUploadCard
            label={t("fields.insurance.label")}
            helperText={t("fields.insurance.helperText")}
            accept="image/*,.pdf"
            onFileSelect={handleFileChange("insurance")}
          />
        </div>

        {/* Alert */}
        <Card
          variant="bordered"
          accent="blue"
          padding="sm"
          className="flex items-start gap-3 bg-vaca-blue/5"
        >
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-vaca-blue-dark"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="font-inter text-sm text-vaca-neutral-gray-600">
            {t("alert")}
          </p>
        </Card>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            colorScheme="neutral"
            variant="outline"
            size="lg"
            onClick={() => router.push("/onboarding/producer/profile")}
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
            {isSubmitting ? t("buttons.submitting") : t("buttons.submit")}
          </Button>
        </div>
      </motion.form>
    </OnboardingShell>
  );
}
