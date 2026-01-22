"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "~~/lib/i18n/routing";
import { cn } from "~~/lib/utils/cn";
import {
  CountrySelect,
  FormRow,
  OnboardingShell,
  OnboardingSteps,
  shellItemVariants,
} from "~~/app/[locale]/(onboarding)/_components";
import { Button, Card } from "~~/components/ui";
import { useLogin } from "~~/hooks/auth/useLogin";
import { useCreateProducer } from "~~/hooks/producers/useCreateProducer";
import { useLotDraftStore } from "~~/services/store/lotDraft";


interface FormData {
  name: string;
  email: string;
  senasaId: string;
  farmName: string;
  country: string;
  province: string;
  city: string;
  yearsOperating: string;
  description: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  senasaId?: string;
  farmName?: string;
  country?: string;
  province?: string;
  city?: string;
  yearsOperating?: string;
}

/**
 * ProducerProfileScreen (ONB-PROD-01)
 * Collects producer/farm profile data
 * Step 1 of 2 in producer onboarding
 */
export function ProducerProfileScreen() {
  const t = useTranslations("onboarding.producerProfile");
  const router = useRouter();
  const login = useLogin();
  const createProducer = useCreateProducer();
  const updateDraft = useLotDraftStore(state => state.updateDraft);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    senasaId: "",
    farmName: "",
    country: "",
    province: "",
    city: "",
    yearsOperating: "",
    description: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { label: t("steps.farm"), status: "active" as const },
    { label: t("steps.verification"), status: "pending" as const },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    }
    if (!formData.senasaId.trim()) {
      newErrors.senasaId = "SENASA ID is required.";
    }
    if (!formData.farmName.trim()) {
      newErrors.farmName = t("errors.farmNameRequired");
    }

    if (!formData.country) {
      newErrors.country = t("errors.countryRequired");
    }

    if (!formData.province.trim()) {
      newErrors.province = t("errors.provinceRequired");
    }

    if (!formData.city.trim()) {
      newErrors.city = t("errors.cityRequired");
    }

    const yearsOperating = Number(formData.yearsOperating);
    if (!formData.yearsOperating.trim()) {
      newErrors.yearsOperating = t("errors.yearsOperatingRequired");
    } else if (Number.isNaN(yearsOperating) || yearsOperating <= 0) {
      newErrors.yearsOperating = t("errors.yearsOperatingInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await login.mutateAsync({
        email: formData.email,
        name: formData.name,
        role: "PRODUCER",
      });
      const locationParts = [
        formData.city.trim(),
        formData.province.trim(),
        formData.country.trim(),
      ].filter(Boolean);
      const producer = await createProducer.mutateAsync({
        name: formData.name,
        email: formData.email,
        senasaId: formData.senasaId,
        location: locationParts.length > 0 ? locationParts.join(", ") : undefined,
        yearsOperating: Number(formData.yearsOperating),
      });
      updateDraft({ producerId: producer.userId });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        email: error instanceof Error ? error.message : "Login failed.",
      }));
      setIsSubmitting(false);
      return;
    }

    // Navigate to verification screen
    router.push("/onboarding/producer/verification");
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSelectChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
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
        <FormRow
          label="Contact name"
          placeholder="Full name"
          value={formData.name}
          onChange={handleInputChange("name")}
          error={errors.name}
          autoComplete="name"
          disabled={isSubmitting}
        />

        <FormRow
          label="Email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleInputChange("email")}
          error={errors.email}
          autoComplete="email"
          disabled={isSubmitting}
        />

        <FormRow
          label="SENASA ID"
          placeholder="Enter SENASA ID"
          value={formData.senasaId}
          onChange={handleInputChange("senasaId")}
          error={errors.senasaId}
          disabled={isSubmitting}
        />

        <FormRow
          label={t("fields.farmName.label")}
          placeholder={t("fields.farmName.placeholder")}
          value={formData.farmName}
          onChange={handleInputChange("farmName")}
          error={errors.farmName}
          autoComplete="organization"
          disabled={isSubmitting}
        />

        <CountrySelect
          label={t("fields.country.label")}
          value={formData.country}
          onChange={handleSelectChange("country")}
          error={errors.country}
          disabled={isSubmitting}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormRow
            label={t("fields.province.label")}
            placeholder={t("fields.province.placeholder")}
            value={formData.province}
            onChange={handleInputChange("province")}
            error={errors.province}
            autoComplete="address-level1"
            disabled={isSubmitting}
          />

          <FormRow
            label={t("fields.city.label")}
            placeholder={t("fields.city.placeholder")}
            value={formData.city}
            onChange={handleInputChange("city")}
            error={errors.city}
            autoComplete="address-level2"
            disabled={isSubmitting}
          />
        </div>

        <FormRow
          label={t("fields.yearsOperating.label")}
          type="number"
          min="0"
          placeholder={t("fields.yearsOperating.placeholder")}
          value={formData.yearsOperating}
          onChange={handleInputChange("yearsOperating")}
          error={errors.yearsOperating}
          disabled={isSubmitting}
        />

        {/* Description textarea */}
        <div>
          <label
            htmlFor="description"
            className="mb-2 flex items-center gap-1 font-inter text-sm font-medium text-vaca-neutral-gray-700"
          >
            {t("fields.description.label")}
            <span className="text-vaca-neutral-gray-400">
              ({t("fields.description.optional")})
            </span>
          </label>
          <textarea
            id="description"
            placeholder={t("fields.description.placeholder")}
            value={formData.description}
            onChange={handleInputChange("description")}
            maxLength={280}
            rows={3}
            disabled={isSubmitting}
            className={cn(
              "w-full resize-none rounded-xl border-2 px-4 py-3 font-inter text-base transition-colors duration-200",
              "bg-vaca-neutral-white text-vaca-neutral-gray-900",
              "placeholder:text-vaca-neutral-gray-400",
              "focus:border-vaca-green focus:outline-none focus:ring-0",
              "border-vaca-neutral-gray-200",
              "disabled:cursor-not-allowed disabled:bg-vaca-neutral-gray-100 disabled:text-vaca-neutral-gray-400",
            )}
          />
          <p className="mt-1 text-right font-inter text-xs text-vaca-neutral-gray-400">
            {formData.description.length}/280
          </p>
        </div>

        {/* Info card */}
        <Card
          variant="bordered"
          accent="blue"
          padding="sm"
          className="bg-vaca-blue/5"
        >
          <p className="font-inter text-sm text-vaca-neutral-gray-600">
            {t("infoCard")}
          </p>
        </Card>

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
