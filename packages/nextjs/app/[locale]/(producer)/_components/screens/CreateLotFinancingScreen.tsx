"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "~~/lib/utils/cn";
import { ProducerWizardStepper } from "../ui/ProducerWizardStepper";
import { useLotDraftStore } from "~~/services/store/lotDraft";

type FinancingFormState = {
  totalCapital: number;
  investorPercent: number;
  fundingDeadline: string;
  operatingCosts: number;
};

const STEPS = [
  "Basic Info",
  "Herd & Cycle",
  "Financing",
  "Documents",
  "Review",
];

const INITIAL_STATE: FinancingFormState = {
  totalCapital: 0,
  investorPercent: 35,
  fundingDeadline: "",
  operatingCosts: 0,
};

export function CreateLotFinancingScreen() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [formState, setFormState] =
    useState<FinancingFormState>(INITIAL_STATE);
  const draft = useLotDraftStore(state => state.draft);
  const updateDraft = useLotDraftStore(state => state.updateDraft);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FinancingFormState, string>>
  >({});

  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      totalCapital: draft.financing.totalCapital,
      investorPercent: draft.financing.investorPercent,
      fundingDeadline: draft.financing.fundingDeadline,
      operatingCosts: draft.financing.operatingCosts,
    }));
  }, [draft]);

  const transition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    [prefersReducedMotion],
  );

  const handleTextChange = (field: "fundingDeadline", value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleNumberChange = (
    field: "totalCapital" | "operatingCosts",
    value: string,
  ) => {
    const parsed = value === "" ? 0 : Number(value);
    setFormState(prev => ({ ...prev, [field]: parsed }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handlePercentChange = (value: number) => {
    const nextValue = Math.min(100, Math.max(0, value));
    setFormState(prev => ({ ...prev, investorPercent: nextValue }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FinancingFormState, string>> = {};

    if (formState.totalCapital <= 0) {
      nextErrors.totalCapital = "Total capital is required.";
    }
    if (!formState.fundingDeadline.trim()) {
      nextErrors.fundingDeadline = "Funding deadline is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    updateDraft({
      financing: {
        totalCapital: formState.totalCapital,
        investorPercent: formState.investorPercent,
        fundingDeadline: formState.fundingDeadline,
        operatingCosts: formState.operatingCosts,
      },
    });
    router.push("/producer/lots/new/documents");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className="space-y-8"
    >
      <ProducerWizardStepper steps={STEPS} currentStep={2} />

      <header>
        <h1 className="font-playfair text-4xl font-semibold text-vaca-neutral-gray-900">
          Financing structure
        </h1>
        <p className="mt-2 text-sm text-vaca-neutral-gray-500">
          Define how much capital is required and the investor allocation.
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
            <label className="label" htmlFor="total-capital">
              <span className="label-text font-medium">
                Total capital required (USD)
              </span>
            </label>
            <input
              id="total-capital"
              name="totalCapital"
              type="number"
              min={0}
              className={cn(
                "input input-bordered w-full",
                errors.totalCapital && "border-vaca-brown",
              )}
              value={formState.totalCapital || ""}
              onChange={event =>
                handleNumberChange("totalCapital", event.target.value)
              }
              aria-invalid={Boolean(errors.totalCapital)}
              aria-describedby={
                errors.totalCapital ? "total-capital-error" : undefined
              }
              required
            />
            {errors.totalCapital && (
              <p
                id="total-capital-error"
                className="mt-1 text-xs text-vaca-brown"
              >
                {errors.totalCapital}
              </p>
            )}
          </div>

          <div className="form-control">
            <label className="label" htmlFor="funding-deadline">
              <span className="label-text font-medium">
                Funding deadline date
              </span>
            </label>
            <input
              id="funding-deadline"
              name="fundingDeadline"
              type="date"
              className={cn(
                "input input-bordered w-full",
                errors.fundingDeadline && "border-vaca-brown",
              )}
              value={formState.fundingDeadline}
              onChange={event =>
                handleTextChange("fundingDeadline", event.target.value)
              }
              aria-invalid={Boolean(errors.fundingDeadline)}
              aria-describedby={
                errors.fundingDeadline ? "funding-deadline-error" : undefined
              }
              required
            />
            {errors.fundingDeadline && (
              <p
                id="funding-deadline-error"
                className="mt-1 text-xs text-vaca-brown"
              >
                {errors.fundingDeadline}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-vaca-neutral-gray-700">
                Percentage offered to investors
              </p>
              <p className="text-xs text-vaca-neutral-gray-500">
                Adjust the offered stake as a percentage of total capital.
              </p>
            </div>
            <input
              type="number"
              min={0}
              max={100}
              className="input input-bordered w-28"
              value={formState.investorPercent}
              onChange={event =>
                handlePercentChange(Number(event.target.value))
              }
              aria-label="Investor percentage"
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={formState.investorPercent}
            onChange={event =>
              handlePercentChange(Number(event.target.value))
            }
            className="range range-sm mt-4"
            aria-label="Investor percentage slider"
          />
          <div className="mt-2 flex justify-between text-xs text-vaca-neutral-gray-500">
            <span>0%</span>
            <span className="font-semibold text-vaca-green">
              {formState.investorPercent}%
            </span>
            <span>100%</span>
          </div>
        </div>

        <div className="form-control max-w-sm">
          <label className="label" htmlFor="operating-costs">
            <span className="label-text font-medium">
              Estimated operating costs (optional)
            </span>
          </label>
          <input
            id="operating-costs"
            name="operatingCosts"
            type="number"
            min={0}
            className="input input-bordered w-full"
            value={formState.operatingCosts || ""}
            onChange={event =>
              handleNumberChange("operatingCosts", event.target.value)
            }
          />
        </div>

        <div className="rounded-xl border-l-4 border-vaca-blue bg-vaca-neutral-white p-4 text-sm text-vaca-neutral-gray-600">
          <p className="font-semibold text-vaca-blue">
            Final terms are subject to platform approval.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/producer/lots/new/herd"
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
