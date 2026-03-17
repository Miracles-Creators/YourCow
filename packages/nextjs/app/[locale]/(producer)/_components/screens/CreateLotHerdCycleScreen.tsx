"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "~~/lib/utils/cn";
import { ProducerWizardStepper } from "../ui/ProducerWizardStepper";
import { useLotDraftStore } from "~~/services/store/lotDraft";

type HerdCycleFormState = {
  cattleCount: number;
  averageWeightKg: number;
  initialWeightKg: number;
  durationWeeks: number;
  targetEndDate: string;
  notes: string;
};

type TimelineMode = "duration" | "date";

const INITIAL_STATE: HerdCycleFormState = {
  cattleCount: 0,
  averageWeightKg: 0,
  initialWeightKg: 0,
  durationWeeks: 0,
  targetEndDate: "",
  notes: "",
};

export function CreateLotHerdCycleScreen() {
  const t = useTranslations("producer.createLot");
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const steps = [
    t("steps.basicInfo"),
    t("steps.herdCycle"),
    t("steps.financing"),
    t("steps.documents"),
    t("steps.review"),
  ];
  const [formState, setFormState] = useState<HerdCycleFormState>(INITIAL_STATE);
  const [mode, setMode] = useState<TimelineMode>("duration");
  const draft = useLotDraftStore((state) => state.draft);
  const updateDraft = useLotDraftStore((state) => state.updateDraft);
  const [errors, setErrors] = useState<
    Partial<Record<keyof HerdCycleFormState, string>>
  >({});

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      cattleCount: draft.herdCycle.cattleCount,
      averageWeightKg: draft.herdCycle.averageWeightKg,
      initialWeightKg: draft.herdCycle.initialWeightKg,
      durationWeeks: draft.herdCycle.durationWeeks,
      targetEndDate: draft.herdCycle.targetEndDate,
      notes: draft.herdCycle.notes,
    }));
    setMode(draft.herdCycle.timelineMode);
  }, [draft]);

  const transition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    [prefersReducedMotion],
  );

  const handleTextChange = (
    field: "targetEndDate" | "notes",
    value: string,
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleNumberChange = (
    field:
      | "cattleCount"
      | "averageWeightKg"
      | "initialWeightKg"
      | "durationWeeks",
    value: string,
  ) => {
    const parsed = value === "" ? 0 : Number(value);
    setFormState((prev) => ({ ...prev, [field]: parsed }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof HerdCycleFormState, string>> = {};

    if (formState.cattleCount <= 0) {
      nextErrors.cattleCount = t("herdCycle.errors.cattleCountRequired");
    }
    if (formState.averageWeightKg <= 0) {
      nextErrors.averageWeightKg = t("herdCycle.errors.averageWeightRequired");
    }
    if (formState.initialWeightKg <= 0) {
      nextErrors.initialWeightKg = t("herdCycle.errors.initialWeightRequired");
    }
    if (mode === "duration" && formState.durationWeeks <= 0) {
      nextErrors.durationWeeks = t("herdCycle.errors.durationRequired");
    }
    if (mode === "date" && !formState.targetEndDate.trim()) {
      nextErrors.targetEndDate = t("herdCycle.errors.targetDateRequired");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    updateDraft({
      herdCycle: {
        cattleCount: formState.cattleCount,
        averageWeightKg: formState.averageWeightKg,
        initialWeightKg: formState.initialWeightKg,
        durationWeeks: formState.durationWeeks,
        targetEndDate: formState.targetEndDate,
        notes: formState.notes,
        timelineMode: mode,
      },
    });
    router.push("/producer/lots/new/financing");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className="space-y-8"
    >
      <ProducerWizardStepper steps={steps} currentStep={1} />

      <header>
        <h1 className="font-playfair text-4xl font-semibold text-vaca-neutral-gray-900">
          {t("herdCycle.title")}
        </h1>
        <p className="mt-2 text-sm text-vaca-neutral-gray-500">
          {t("herdCycle.subtitle")}
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
            <label className="label" htmlFor="cattle-count">
              <span className="label-text font-medium">{t("herdCycle.fields.cattleCount.label")}</span>
            </label>
            <input
              id="cattle-count"
              name="cattleCount"
              type="number"
              min={0}
              step={1}
              className={cn(
                "input input-bordered w-full",
                errors.cattleCount && "border-vaca-brown",
              )}
              value={formState.cattleCount || ""}
              onChange={(event) =>
                handleNumberChange("cattleCount", event.target.value)
              }
              aria-invalid={Boolean(errors.cattleCount)}
              aria-describedby={
                errors.cattleCount ? "cattle-count-error" : undefined
              }
              required
            />
            {errors.cattleCount && (
              <p
                id="cattle-count-error"
                className="mt-1 text-xs text-vaca-brown"
              >
                {errors.cattleCount}
              </p>
            )}
          </div>

          <div className="form-control">
            <label className="label" htmlFor="average-weight">
              <span className="label-text font-medium">
                {t("herdCycle.fields.averageWeightKg.label")}
              </span>
            </label>
            <input
              id="average-weight"
              name="averageWeightKg"
              type="number"
              min={0}
              step={1}
              className={cn(
                "input input-bordered w-full",
                errors.averageWeightKg && "border-vaca-brown",
              )}
              value={formState.averageWeightKg || ""}
              onChange={(event) =>
                handleNumberChange("averageWeightKg", event.target.value)
              }
              aria-invalid={Boolean(errors.averageWeightKg)}
              aria-describedby={
                errors.averageWeightKg ? "average-weight-error" : undefined
              }
              required
            />
            {errors.averageWeightKg && (
              <p
                id="average-weight-error"
                className="mt-1 text-xs text-vaca-brown"
              >
                {errors.averageWeightKg}
              </p>
            )}
          </div>

          <div className="form-control">
            <label className="label" htmlFor="initial-weight">
              <span className="label-text font-medium">
                {t("herdCycle.fields.initialWeightKg.label")}
              </span>
            </label>
            <input
              id="initial-weight"
              name="initialWeightKg"
              type="number"
              min={0}
              step={1}
              className={cn(
                "input input-bordered w-full",
                errors.initialWeightKg && "border-vaca-brown",
              )}
              value={formState.initialWeightKg || ""}
              onChange={(event) =>
                handleNumberChange("initialWeightKg", event.target.value)
              }
              aria-invalid={Boolean(errors.initialWeightKg)}
              aria-describedby={
                errors.initialWeightKg ? "initial-weight-error" : undefined
              }
              required
            />
            {errors.initialWeightKg && (
              <p
                id="initial-weight-error"
                className="mt-1 text-xs text-vaca-brown"
              >
                {errors.initialWeightKg}
              </p>
            )}
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-vaca-neutral-gray-700">
            {t("herdCycle.timeline.label")}
          </legend>
          <div className="flex flex-wrap gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-vaca-neutral-gray-600">
              <input
                type="radio"
                name="timeline-mode"
                className="radio radio-sm border-vaca-neutral-gray-300 checked:bg-vaca-green"
                checked={mode === "duration"}
                onChange={() => setMode("duration")}
              />
              {t("herdCycle.timeline.durationOption")}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-vaca-neutral-gray-600">
              <input
                type="radio"
                name="timeline-mode"
                className="radio radio-sm border-vaca-neutral-gray-300 checked:bg-vaca-green"
                checked={mode === "date"}
                onChange={() => setMode("date")}
              />
              {t("herdCycle.timeline.dateOption")}
            </label>
          </div>

          {mode === "duration" ? (
            <div className="form-control max-w-xs">
              <input
                id="duration-weeks"
                name="durationWeeks"
                type="number"
                min={1}
                step={1}
                className={cn(
                  "input input-bordered w-full",
                  errors.durationWeeks && "border-vaca-brown",
                )}
                value={formState.durationWeeks || ""}
                onChange={(event) =>
                  handleNumberChange("durationWeeks", event.target.value)
                }
                aria-invalid={Boolean(errors.durationWeeks)}
                aria-describedby={
                  errors.durationWeeks ? "duration-weeks-error" : undefined
                }
                placeholder={t("herdCycle.timeline.placeholder")}
                required
              />
              {errors.durationWeeks && (
                <p
                  id="duration-weeks-error"
                  className="mt-1 text-xs text-vaca-brown"
                >
                  {errors.durationWeeks}
                </p>
              )}
            </div>
          ) : (
            <div className="form-control max-w-xs">
              <input
                id="target-end-date"
                name="targetEndDate"
                type="date"
                className={cn(
                  "input input-bordered w-full",
                  errors.targetEndDate && "border-vaca-brown",
                )}
                value={formState.targetEndDate}
                onChange={(event) =>
                  handleTextChange("targetEndDate", event.target.value)
                }
                aria-invalid={Boolean(errors.targetEndDate)}
                aria-describedby={
                  errors.targetEndDate ? "target-end-date-error" : undefined
                }
                required
              />
              {errors.targetEndDate && (
                <p
                  id="target-end-date-error"
                  className="mt-1 text-xs text-vaca-brown"
                >
                  {errors.targetEndDate}
                </p>
              )}
            </div>
          )}
        </fieldset>

        <div className="rounded-xl border-l-4 border-vaca-blue bg-vaca-neutral-white p-4 text-sm text-vaca-neutral-gray-600">
          <p className="font-semibold text-vaca-blue">{t("herdCycle.investorNote.title")}</p>
          <p className="mt-1">
            {t("herdCycle.investorNote.description")}
          </p>
        </div>

        <div className="form-control">
          <label className="label" htmlFor="notes">
            <span className="label-text font-medium">{t("herdCycle.fields.notes.label")}</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            className="textarea textarea-bordered min-h-[120px] w-full"
            value={formState.notes}
            onChange={(event) => handleTextChange("notes", event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/producer/lots/new"
            className="btn btn-ghost text-vaca-neutral-gray-600"
          >
            {t("herdCycle.buttons.back")}
          </Link>
          <button
            type="submit"
            className={cn(
              "btn btn-primary w-full sm:w-auto",
              "border-vaca-green bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-blue focus-visible:ring-offset-2 focus-visible:ring-offset-vaca-neutral-bg",
            )}
          >
            {t("herdCycle.buttons.continue")}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
