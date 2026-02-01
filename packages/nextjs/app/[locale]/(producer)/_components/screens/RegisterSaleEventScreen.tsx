"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "~~/lib/utils/cn";
import { useCreateSettlement } from "~~/hooks/settlements/useCreateSettlement";

type SaleFormState = {
  saleDate: string;
  totalAmount: string;
  finalCosts: string;
  notes: string;
  finalTotalWeightGrams: string;
  finalAverageWeightGrams: string;
  initialTotalWeightGrams: string;
};

const INITIAL_STATE: SaleFormState = {
  saleDate: "",
  totalAmount: "",
  finalCosts: "",
  notes: "",
  finalTotalWeightGrams: "",
  finalAverageWeightGrams: "",
  initialTotalWeightGrams: "",
};

export function RegisterSaleEventScreen() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const params = useParams();
  const lotId = typeof params.lotId === "string" ? params.lotId : "";
  const createSettlement = useCreateSettlement();
  const [formState, setFormState] = useState<SaleFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const transition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    [prefersReducedMotion],
  );

  const handleChange = (field: keyof SaleFormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formState.saleDate.trim()) {
      nextErrors.saleDate = "Sale date is required.";
    }
    if (!formState.totalAmount.trim()) {
      nextErrors.totalAmount = "Total sale amount is required.";
    }
    if (!formState.finalTotalWeightGrams.trim()) {
      nextErrors.finalTotalWeightGrams = "Final total weight is required.";
    }
    if (!formState.finalAverageWeightGrams.trim()) {
      nextErrors.finalAverageWeightGrams = "Final average weight is required.";
    }
    if (!formState.initialTotalWeightGrams.trim()) {
      nextErrors.initialTotalWeightGrams = "Initial total weight is required.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const parseNumber = (value: string) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    const parsedLotId = Number(lotId);
    if (!Number.isFinite(parsedLotId)) {
      setSubmitError("Invalid lot id.");
      return;
    }

    const totalProceeds = parseNumber(formState.totalAmount);
    const finalTotalWeightGrams = parseNumber(formState.finalTotalWeightGrams);
    const finalAverageWeightGrams = parseNumber(formState.finalAverageWeightGrams);
    const initialTotalWeightGrams = parseNumber(formState.initialTotalWeightGrams);

    if (
      totalProceeds === null ||
      finalTotalWeightGrams === null ||
      finalAverageWeightGrams === null ||
      initialTotalWeightGrams === null
    ) {
      setSubmitError("Please provide valid numeric values.");
      return;
    }

    try {
      await createSettlement.mutateAsync({
        lotId: parsedLotId,
        totalProceeds,
        currency: "USD",
        finalTotalWeightGrams,
        finalAverageWeightGrams,
        initialTotalWeightGrams,
      });
      router.push(`/producer/lots/${lotId}/sale/submitted`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit sale event.",
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className="space-y-6"
    >
      <header>
        <h1 className="font-playfair text-4xl font-semibold text-vaca-neutral-gray-900">
          Register sale
        </h1>
        <p className="mt-2 text-sm text-vaca-neutral-gray-500">
          Submit the final sale details to begin settlement processing.
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
            <label className="label" htmlFor="sale-date">
              <span className="label-text font-medium">Sale date</span>
            </label>
            <input
              id="sale-date"
              type="date"
              className={cn(
                "input input-bordered w-full",
                errors.saleDate && "border-vaca-brown",
              )}
              value={formState.saleDate}
              onChange={event => handleChange("saleDate", event.target.value)}
              aria-invalid={Boolean(errors.saleDate)}
              aria-describedby={errors.saleDate ? "sale-date-error" : undefined}
              required
            />
            {errors.saleDate && (
              <p id="sale-date-error" className="mt-1 text-xs text-vaca-brown">
                {errors.saleDate}
              </p>
            )}
          </div>

          <div className="form-control">
            <label className="label" htmlFor="total-amount">
              <span className="label-text font-medium">
                Total sale amount (USD)
              </span>
            </label>
            <input
              id="total-amount"
              type="number"
              min={0}
              step={1}
              className={cn(
                "input input-bordered w-full",
                errors.totalAmount && "border-vaca-brown",
              )}
              value={formState.totalAmount}
              onChange={event => handleChange("totalAmount", event.target.value)}
              aria-invalid={Boolean(errors.totalAmount)}
              aria-describedby={
                errors.totalAmount ? "total-amount-error" : undefined
              }
              required
            />
            {errors.totalAmount && (
              <p
                id="total-amount-error"
                className="mt-1 text-xs text-vaca-brown"
              >
                {errors.totalAmount}
              </p>
            )}
          </div>

          <div className="form-control">
            <label className="label" htmlFor="final-costs">
              <span className="label-text font-medium">
                Final costs (optional)
              </span>
            </label>
            <input
              id="final-costs"
              type="number"
              min={0}
              step={1}
              className="input input-bordered w-full"
              value={formState.finalCosts}
              onChange={event => handleChange("finalCosts", event.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label" htmlFor="final-total-weight">
              <span className="label-text font-medium">
                Final total weight (grams)
              </span>
            </label>
            <input
              id="final-total-weight"
              type="number"
              min={0}
              step={1}
              className={cn(
                "input input-bordered w-full",
                errors.finalTotalWeightGrams && "border-vaca-brown",
              )}
              value={formState.finalTotalWeightGrams}
              onChange={event =>
                handleChange("finalTotalWeightGrams", event.target.value)
              }
              aria-invalid={Boolean(errors.finalTotalWeightGrams)}
              aria-describedby={
                errors.finalTotalWeightGrams ? "final-total-weight-error" : undefined
              }
              required
            />
            {errors.finalTotalWeightGrams && (
              <p
                id="final-total-weight-error"
                className="mt-1 text-xs text-vaca-brown"
              >
                {errors.finalTotalWeightGrams}
              </p>
            )}
          </div>

          <div className="form-control">
            <label className="label" htmlFor="final-average-weight">
              <span className="label-text font-medium">
                Final average weight (grams)
              </span>
            </label>
            <input
              id="final-average-weight"
              type="number"
              min={0}
              step={1}
              className={cn(
                "input input-bordered w-full",
                errors.finalAverageWeightGrams && "border-vaca-brown",
              )}
              value={formState.finalAverageWeightGrams}
              onChange={event =>
                handleChange("finalAverageWeightGrams", event.target.value)
              }
              aria-invalid={Boolean(errors.finalAverageWeightGrams)}
              aria-describedby={
                errors.finalAverageWeightGrams
                  ? "final-average-weight-error"
                  : undefined
              }
              required
            />
            {errors.finalAverageWeightGrams && (
              <p
                id="final-average-weight-error"
                className="mt-1 text-xs text-vaca-brown"
              >
                {errors.finalAverageWeightGrams}
              </p>
            )}
          </div>

          <div className="form-control">
            <label className="label" htmlFor="initial-total-weight">
              <span className="label-text font-medium">
                Initial total weight (grams)
              </span>
            </label>
            <input
              id="initial-total-weight"
              type="number"
              min={0}
              step={1}
              className={cn(
                "input input-bordered w-full",
                errors.initialTotalWeightGrams && "border-vaca-brown",
              )}
              value={formState.initialTotalWeightGrams}
              onChange={event =>
                handleChange("initialTotalWeightGrams", event.target.value)
              }
              aria-invalid={Boolean(errors.initialTotalWeightGrams)}
              aria-describedby={
                errors.initialTotalWeightGrams
                  ? "initial-total-weight-error"
                  : undefined
              }
              required
            />
            {errors.initialTotalWeightGrams && (
              <p
                id="initial-total-weight-error"
                className="mt-1 text-xs text-vaca-brown"
              >
                {errors.initialTotalWeightGrams}
              </p>
            )}
          </div>
        </div>

        <div className="form-control">
          <label className="label" htmlFor="sale-notes">
            <span className="label-text font-medium">Notes (optional)</span>
          </label>
          <textarea
            id="sale-notes"
            className="textarea textarea-bordered min-h-[120px] w-full"
            value={formState.notes}
            onChange={event => handleChange("notes", event.target.value)}
          />
        </div>

        <div className="rounded-xl border-l-4 border-vaca-blue bg-vaca-neutral-white p-4 text-sm text-vaca-neutral-gray-600">
          <p className="font-semibold text-vaca-blue">
            This triggers settlement processing for investors.
          </p>
        </div>

        {submitError ? (
          <p className="text-sm text-vaca-brown">{submitError}</p>
        ) : null}

        <button
          type="submit"
          disabled={createSettlement.isPending}
          className={cn(
            "btn btn-primary w-full sm:w-auto",
            "border-vaca-green bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-blue focus-visible:ring-offset-2 focus-visible:ring-offset-vaca-neutral-bg",
          )}
        >
          {createSettlement.isPending ? "Submitting..." : "Submit sale event"}
        </button>
      </motion.form>
    </motion.div>
  );
}
