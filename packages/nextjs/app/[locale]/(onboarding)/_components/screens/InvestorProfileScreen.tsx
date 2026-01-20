"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "~~/lib/i18n/routing";
import {
  CountrySelect,
  FormRow,
  OnboardingShell,
  OnboardingSteps,
  PhoneInput,
  shellItemVariants,
} from "~~/app/[locale]/(onboarding)/_components";
import { Button } from "~~/components/ui";

interface FormData {
  country: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

interface FormErrors {
  country?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

/**
 * InvestorProfileScreen (ONB-INV-01)
 * Collects investor profile data: country, phone, address
 * Step 1 of 2 in investor onboarding
 */
export function InvestorProfileScreen() {
  const t = useTranslations("onboarding.investorProfile");
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    country: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { label: t("steps.profile"), status: "active" as const },
    { label: t("steps.verification"), status: "pending" as const },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.country) {
      newErrors.country = t("errors.countryRequired");
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t("errors.phoneRequired");
    } else if (formData.phone.trim().length < 8) {
      newErrors.phone = t("errors.phoneTooShort");
    }

    if (!formData.address.trim()) {
      newErrors.address = t("errors.addressRequired");
    }

    if (!formData.city.trim()) {
      newErrors.city = t("errors.cityRequired");
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = t("errors.postalCodeRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Mock API call - replace with actual profile save
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Navigate to KYC screen
    router.push("/onboarding/investor/kyc");
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSelectChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
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
        <CountrySelect
          label={t("fields.country.label")}
          value={formData.country}
          onChange={handleSelectChange("country")}
          error={errors.country}
          helperText={t("fields.country.helperText")}
          disabled={isSubmitting}
        />

        <PhoneInput
          label={t("fields.phone.label")}
          value={formData.phone}
          onChange={handleInputChange("phone")}
          error={errors.phone}
          disabled={isSubmitting}
        />

        <FormRow
          label={t("fields.address.label")}
          placeholder={t("fields.address.placeholder")}
          value={formData.address}
          onChange={handleInputChange("address")}
          error={errors.address}
          autoComplete="street-address"
          disabled={isSubmitting}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormRow
            label={t("fields.city.label")}
            placeholder={t("fields.city.placeholder")}
            value={formData.city}
            onChange={handleInputChange("city")}
            error={errors.city}
            autoComplete="address-level2"
            disabled={isSubmitting}
          />

          <FormRow
            label={t("fields.postalCode.label")}
            placeholder={t("fields.postalCode.placeholder")}
            value={formData.postalCode}
            onChange={handleInputChange("postalCode")}
            error={errors.postalCode}
            autoComplete="postal-code"
            disabled={isSubmitting}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            colorScheme="neutral"
            variant="outline"
            size="lg"
            onClick={() => router.push("/onboarding/role")}
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
            {isSubmitting ? t("buttons.submitting") : t("buttons.continue")}
          </Button>
        </div>
      </motion.form>
    </OnboardingShell>
  );
}
