"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "~~/lib/utils/cn";

type SaleFormState = {
  saleDate: string;
  totalAmount: string;
  finalCosts: string;
  notes: string;
};

const INITIAL_STATE: SaleFormState = {
  saleDate: "",
  totalAmount: "",
  finalCosts: "",
  notes: "",
};

export function RegisterSaleEventScreen() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const params = useParams();
  const lotId = typeof params.lotId === "string" ? params.lotId : "lot-001";
  const [formState, setFormState] = useState<SaleFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    router.push(`/producer/lots/${lotId}/sale/submitted`);
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
              className="input input-bordered w-full"
              value={formState.finalCosts}
              onChange={event => handleChange("finalCosts", event.target.value)}
            />
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

        <button
          type="submit"
          className={cn(
            "btn btn-primary w-full sm:w-auto",
            "border-vaca-green bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-blue focus-visible:ring-offset-2 focus-visible:ring-offset-vaca-neutral-bg",
          )}
        >
          Submit sale event
        </button>
      </motion.form>
    </motion.div>
  );
}
