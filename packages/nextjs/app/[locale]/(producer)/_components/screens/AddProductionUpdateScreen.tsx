"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "~~/lib/utils/cn";
import { UploadDropzone } from "../ui/UploadDropzone";

type UpdateType = "weight" | "health" | "feeding" | "event";

type UpdateFormState = {
  type: UpdateType;
  weight: string;
  weightDate: string;
  healthStatus: string;
  healthNotes: string;
  feedingNotes: string;
  eventNotes: string;
};

const INITIAL_STATE: UpdateFormState = {
  type: "weight",
  weight: "",
  weightDate: "",
  healthStatus: "",
  healthNotes: "",
  feedingNotes: "",
  eventNotes: "",
};

export function AddProductionUpdateScreen() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const params = useParams();
  const lotId = typeof params.lotId === "string" ? params.lotId : "lot-001";
  const [formState, setFormState] = useState<UpdateFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const transition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    [prefersReducedMotion],
  );

  const handleChange = (field: keyof UpdateFormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (formState.type === "weight") {
      if (!formState.weight.trim()) {
        nextErrors.weight = "Average weight is required.";
      }
      if (!formState.weightDate.trim()) {
        nextErrors.weightDate = "Date is required.";
      }
    }

    if (formState.type === "health" && !formState.healthStatus.trim()) {
      nextErrors.healthStatus = "Health status is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    router.push(`/producer/lots/${lotId}`);
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
          Add update
        </h1>
        <p className="mt-2 text-sm text-vaca-neutral-gray-500">
          Log operational updates for this lot.
        </p>
      </header>

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6"
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
      >
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-vaca-neutral-gray-700">
            Update type
          </legend>
          <div className="flex flex-wrap gap-3">
            {(
              [
                { label: "Weight", value: "weight" },
                { label: "Health", value: "health" },
                { label: "Feeding", value: "feeding" },
                { label: "Event", value: "event" },
              ] as const
            ).map(option => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-vaca-neutral-gray-200 px-3 py-2 text-sm text-vaca-neutral-gray-600"
              >
                <input
                  type="radio"
                  name="update-type"
                  className="radio radio-sm border-vaca-neutral-gray-300 checked:bg-vaca-green"
                  checked={formState.type === option.value}
                  onChange={() => handleChange("type", option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {formState.type === "weight" && (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-vaca-neutral-gray-700">
              Weight update
            </legend>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="form-control">
                <label className="label" htmlFor="avg-weight">
                  <span className="label-text font-medium">
                    Average weight (kg)
                  </span>
                </label>
                <input
                  id="avg-weight"
                  type="number"
                  min={0}
                  className={cn(
                    "input input-bordered w-full",
                    errors.weight && "border-vaca-brown",
                  )}
                  value={formState.weight}
                  onChange={event => handleChange("weight", event.target.value)}
                  aria-invalid={Boolean(errors.weight)}
                  aria-describedby={errors.weight ? "weight-error" : undefined}
                />
                {errors.weight && (
                  <p id="weight-error" className="mt-1 text-xs text-vaca-brown">
                    {errors.weight}
                  </p>
                )}
              </div>
              <div className="form-control">
                <label className="label" htmlFor="weight-date">
                  <span className="label-text font-medium">Date</span>
                </label>
                <input
                  id="weight-date"
                  type="date"
                  className={cn(
                    "input input-bordered w-full",
                    errors.weightDate && "border-vaca-brown",
                  )}
                  value={formState.weightDate}
                  onChange={event =>
                    handleChange("weightDate", event.target.value)
                  }
                  aria-invalid={Boolean(errors.weightDate)}
                  aria-describedby={
                    errors.weightDate ? "weight-date-error" : undefined
                  }
                />
                {errors.weightDate && (
                  <p
                    id="weight-date-error"
                    className="mt-1 text-xs text-vaca-brown"
                  >
                    {errors.weightDate}
                  </p>
                )}
              </div>
            </div>
          </fieldset>
        )}

        {formState.type === "health" && (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-vaca-neutral-gray-700">
              Health update
            </legend>
            <div className="form-control max-w-sm">
              <label className="label" htmlFor="health-status">
                <span className="label-text font-medium">Status</span>
              </label>
              <select
                id="health-status"
                className={cn(
                  "select select-bordered w-full",
                  errors.healthStatus && "border-vaca-brown",
                )}
                value={formState.healthStatus}
                onChange={event =>
                  handleChange("healthStatus", event.target.value)
                }
                aria-invalid={Boolean(errors.healthStatus)}
                aria-describedby={
                  errors.healthStatus ? "health-status-error" : undefined
                }
              >
                <option value="" disabled>
                  Select status
                </option>
                <option value="stable">Stable</option>
                <option value="monitoring">Monitoring</option>
                <option value="treatment">Treatment ongoing</option>
              </select>
              {errors.healthStatus && (
                <p
                  id="health-status-error"
                  className="mt-1 text-xs text-vaca-brown"
                >
                  {errors.healthStatus}
                </p>
              )}
            </div>
            <div className="form-control">
              <label className="label" htmlFor="health-notes">
                <span className="label-text font-medium">Notes</span>
              </label>
              <textarea
                id="health-notes"
                className="textarea textarea-bordered min-h-[120px] w-full"
                value={formState.healthNotes}
                onChange={event =>
                  handleChange("healthNotes", event.target.value)
                }
              />
            </div>
          </fieldset>
        )}

        {formState.type === "feeding" && (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-vaca-neutral-gray-700">
              Feeding update
            </legend>
            <div className="form-control">
              <label className="label" htmlFor="feeding-notes">
                <span className="label-text font-medium">Feed change notes</span>
              </label>
              <textarea
                id="feeding-notes"
                className="textarea textarea-bordered min-h-[120px] w-full"
                value={formState.feedingNotes}
                onChange={event =>
                  handleChange("feedingNotes", event.target.value)
                }
              />
            </div>
          </fieldset>
        )}

        {formState.type === "event" && (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-vaca-neutral-gray-700">
              Event update
            </legend>
            <div className="form-control">
              <label className="label" htmlFor="event-notes">
                <span className="label-text font-medium">Notes</span>
              </label>
              <textarea
                id="event-notes"
                className="textarea textarea-bordered min-h-[120px] w-full"
                value={formState.eventNotes}
                onChange={event =>
                  handleChange("eventNotes", event.target.value)
                }
              />
            </div>
          </fieldset>
        )}

        <UploadDropzone
          id="update-photo"
          label="Optional photo upload"
          helper="Add a photo to support this update."
          accept="image/*"
          acceptLabel="PNG or JPG"
        />

        <button
          type="submit"
          className={cn(
            "btn btn-primary w-full sm:w-auto",
            "border-vaca-green bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-blue focus-visible:ring-offset-2 focus-visible:ring-offset-vaca-neutral-bg",
          )}
        >
          Submit update
        </button>
      </motion.form>
    </motion.div>
  );
}
