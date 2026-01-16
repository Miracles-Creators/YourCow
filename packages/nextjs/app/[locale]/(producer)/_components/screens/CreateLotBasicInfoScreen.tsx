"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "~~/lib/utils/cn";
import { ProducerWizardStepper } from "../ui/ProducerWizardStepper";

type BasicInfoFormState = {
  lotName: string;
  farmName: string;
  location: string;
  productionType: string;
  startDate: string;
};

const STEPS = [
  "Basic Info",
  "Herd & Cycle",
  "Financing",
  "Documents",
  "Review",
];

const INITIAL_STATE: BasicInfoFormState = {
  lotName: "",
  farmName: "",
  location: "",
  productionType: "",
  startDate: "",
};

export function CreateLotBasicInfoScreen() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [formState, setFormState] = useState<BasicInfoFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<
    Partial<Record<keyof BasicInfoFormState, string>>
  >({});

  const transition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    [prefersReducedMotion],
  );

  const handleChange = (field: keyof BasicInfoFormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof BasicInfoFormState, string>> = {};

    if (!formState.lotName.trim()) {
      nextErrors.lotName = "Lot name is required.";
    }
    if (!formState.farmName.trim()) {
      nextErrors.farmName = "Farm or feedlot name is required.";
    }
    if (!formState.location.trim()) {
      nextErrors.location = "Location is required.";
    }
    if (!formState.productionType) {
      nextErrors.productionType = "Select a production type.";
    }
    if (!formState.startDate) {
      nextErrors.startDate = "Start date is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    router.push("/producer/lots/new/herd");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className="space-y-8"
    >
      <ProducerWizardStepper steps={STEPS} currentStep={0} />

      <header>
        <h1 className="font-playfair text-4xl font-semibold text-vaca-neutral-gray-900">
          Create a new lot
        </h1>
        <p className="mt-2 text-sm text-vaca-neutral-gray-500">
          Capture the essentials so we can register the lot correctly.
        </p>
      </header>

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6"
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="form-control">
            <label className="label" htmlFor="lot-name">
              <span className="label-text font-medium">Lot name</span>
            </label>
            <input
              id="lot-name"
              name="lotName"
              type="text"
              className={cn(
                "input input-bordered w-full",
                errors.lotName && "border-vaca-brown",
              )}
              value={formState.lotName}
              onChange={event => handleChange("lotName", event.target.value)}
              aria-invalid={Boolean(errors.lotName)}
              aria-describedby={errors.lotName ? "lot-name-error" : undefined}
              required
            />
            {errors.lotName && (
              <p
                id="lot-name-error"
                className="mt-1 text-xs text-vaca-brown"
              >
                {errors.lotName}
              </p>
            )}
          </div>

          <div className="form-control">
            <label className="label" htmlFor="farm-name">
              <span className="label-text font-medium">
                Farm / Feedlot name
              </span>
            </label>
            <input
              id="farm-name"
              name="farmName"
              type="text"
              className={cn(
                "input input-bordered w-full",
                errors.farmName && "border-vaca-brown",
              )}
              value={formState.farmName}
              onChange={event => handleChange("farmName", event.target.value)}
              aria-invalid={Boolean(errors.farmName)}
              aria-describedby={errors.farmName ? "farm-name-error" : undefined}
              required
            />
            {errors.farmName && (
              <p
                id="farm-name-error"
                className="mt-1 text-xs text-vaca-brown"
              >
                {errors.farmName}
              </p>
            )}
          </div>

          <div className="form-control">
            <label className="label" htmlFor="location">
              <span className="label-text font-medium">
                Location (Province/State + Country)
              </span>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              className={cn(
                "input input-bordered w-full",
                errors.location && "border-vaca-brown",
              )}
              value={formState.location}
              onChange={event => handleChange("location", event.target.value)}
              aria-invalid={Boolean(errors.location)}
              aria-describedby={errors.location ? "location-error" : undefined}
              required
            />
            {errors.location && (
              <p
                id="location-error"
                className="mt-1 text-xs text-vaca-brown"
              >
                {errors.location}
              </p>
            )}
          </div>

          <div className="form-control">
            <label className="label" htmlFor="production-type">
              <span className="label-text font-medium">Production type</span>
            </label>
            <select
              id="production-type"
              name="productionType"
              className={cn(
                "select select-bordered w-full",
                errors.productionType && "border-vaca-brown",
              )}
              value={formState.productionType}
              onChange={event =>
                handleChange("productionType", event.target.value)
              }
              aria-invalid={Boolean(errors.productionType)}
              aria-describedby={
                errors.productionType ? "production-type-error" : undefined
              }
              required
            >
              <option value="" disabled>
                Select a production type
              </option>
              <option value="feedlot">Feedlot</option>
              <option value="pasture">Pasture</option>
              <option value="mixed">Mixed</option>
            </select>
            <p className="mt-2 text-xs text-vaca-neutral-gray-500">
              Select how this lot will be managed operationally.
            </p>
            {errors.productionType && (
              <p
                id="production-type-error"
                className="mt-1 text-xs text-vaca-brown"
              >
                {errors.productionType}
              </p>
            )}
          </div>

          <div className="form-control">
            <label className="label" htmlFor="start-date">
              <span className="label-text font-medium">Start date</span>
            </label>
            <input
              id="start-date"
              name="startDate"
              type="date"
              className={cn(
                "input input-bordered w-full",
                errors.startDate && "border-vaca-brown",
              )}
              value={formState.startDate}
              onChange={event => handleChange("startDate", event.target.value)}
              aria-invalid={Boolean(errors.startDate)}
              aria-describedby={errors.startDate ? "start-date-error" : undefined}
              required
            />
            {errors.startDate && (
              <p
                id="start-date-error"
                className="mt-1 text-xs text-vaca-brown"
              >
                {errors.startDate}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" className="btn btn-ghost text-vaca-neutral-gray-600">
            Save draft
          </button>
          <button
            type="submit"
            className={cn(
              "btn btn-primary w-full sm:w-auto",
              "border-vaca-green bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-blue focus-visible:ring-offset-2 focus-visible:ring-offset-vaca-neutral-bg",
            )}
          >
            Continue
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
