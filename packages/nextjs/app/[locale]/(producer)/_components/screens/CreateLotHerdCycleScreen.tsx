"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "~~/lib/utils/cn";
import { ProducerWizardStepper } from "../ui/ProducerWizardStepper";
import { useLotDraftStore } from "~~/services/store/lotDraft";

type HerdCycleFormState = {
  cattleCount: string;
  averageWeight: string;
  durationWeeks: string;
  targetEndDate: string;
  notes: string;
};

type TimelineMode = "duration" | "date";

const STEPS = [
  "Basic Info",
  "Herd & Cycle",
  "Financing",
  "Documents",
  "Review",
];

const INITIAL_STATE: HerdCycleFormState = {
  cattleCount: "",
  averageWeight: "",
  durationWeeks: "",
  targetEndDate: "",
  notes: "",
};

export function CreateLotHerdCycleScreen() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [formState, setFormState] =
    useState<HerdCycleFormState>(INITIAL_STATE);
  const [mode, setMode] = useState<TimelineMode>("duration");
  const draft = useLotDraftStore(state => state.draft);
  const updateDraft = useLotDraftStore(state => state.updateDraft);
  const [errors, setErrors] = useState<
    Partial<Record<keyof HerdCycleFormState, string>>
  >({});

  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      cattleCount: draft.herdCycle.cattleCount,
      averageWeight: draft.herdCycle.averageWeight,
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

  const handleChange = (field: keyof HerdCycleFormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof HerdCycleFormState, string>> = {};

    if (!formState.cattleCount.trim()) {
      nextErrors.cattleCount = "Number of cattle is required.";
    }
    if (!formState.averageWeight.trim()) {
      nextErrors.averageWeight = "Average weight is required.";
    }
    if (mode === "duration" && !formState.durationWeeks.trim()) {
      nextErrors.durationWeeks = "Expected duration is required.";
    }
    if (mode === "date" && !formState.targetEndDate.trim()) {
      nextErrors.targetEndDate = "Target end date is required.";
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
        averageWeight: formState.averageWeight,
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
      <ProducerWizardStepper steps={STEPS} currentStep={1} />

      <header>
        <h1 className="font-playfair text-4xl font-semibold text-vaca-neutral-gray-900">
          Herd & production cycle
        </h1>
        <p className="mt-2 text-sm text-vaca-neutral-gray-500">
          Provide operational metrics for transparency and reporting.
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
              <span className="label-text font-medium">Number of cattle</span>
            </label>
            <input
              id="cattle-count"
              name="cattleCount"
              type="number"
              min={0}
              className={cn(
                "input input-bordered w-full",
                errors.cattleCount && "border-vaca-brown",
              )}
              value={formState.cattleCount}
              onChange={event => handleChange("cattleCount", event.target.value)}
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
                Average starting weight (kg)
              </span>
            </label>
            <input
              id="average-weight"
              name="averageWeight"
              type="number"
              min={0}
              className={cn(
                "input input-bordered w-full",
                errors.averageWeight && "border-vaca-brown",
              )}
              value={formState.averageWeight}
              onChange={event => handleChange("averageWeight", event.target.value)}
              aria-invalid={Boolean(errors.averageWeight)}
              aria-describedby={
                errors.averageWeight ? "average-weight-error" : undefined
              }
              required
            />
            {errors.averageWeight && (
              <p
                id="average-weight-error"
                className="mt-1 text-xs text-vaca-brown"
              >
                {errors.averageWeight}
              </p>
            )}
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-vaca-neutral-gray-700">
            Timeline
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
              Expected duration (weeks)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-vaca-neutral-gray-600">
              <input
                type="radio"
                name="timeline-mode"
                className="radio radio-sm border-vaca-neutral-gray-300 checked:bg-vaca-green"
                checked={mode === "date"}
                onChange={() => setMode("date")}
              />
              Target end date
            </label>
          </div>

          {mode === "duration" ? (
            <div className="form-control max-w-xs">
              <input
                id="duration-weeks"
                name="durationWeeks"
                type="number"
                min={1}
                className={cn(
                  "input input-bordered w-full",
                  errors.durationWeeks && "border-vaca-brown",
                )}
                value={formState.durationWeeks}
                onChange={event =>
                  handleChange("durationWeeks", event.target.value)
                }
                aria-invalid={Boolean(errors.durationWeeks)}
                aria-describedby={
                  errors.durationWeeks ? "duration-weeks-error" : undefined
                }
                placeholder="e.g. 24"
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
                onChange={event =>
                  handleChange("targetEndDate", event.target.value)
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
          <p className="font-semibold text-vaca-blue">What investors see</p>
          <p className="mt-1">
            We display these metrics to build investor trust.
          </p>
        </div>

        <div className="form-control">
          <label className="label" htmlFor="notes">
            <span className="label-text font-medium">Notes (optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            className="textarea textarea-bordered min-h-[120px] w-full"
            value={formState.notes}
            onChange={event => handleChange("notes", event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/producer/lots/new"
            className="btn btn-ghost text-vaca-neutral-gray-600"
          >
            Back
          </Link>
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
