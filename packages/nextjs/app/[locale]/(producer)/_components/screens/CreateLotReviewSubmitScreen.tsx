"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "~~/lib/utils/cn";
import { ProducerWizardStepper } from "../ui/ProducerWizardStepper";
import {
  LotDraftSchema,
  useLotDraftStore,
  type LotDraft,
} from "~~/services/store/lotDraft";
import { useCreateLot } from "~~/hooks/lots/useCreateLot";

const STEPS = [
  "Basic Info",
  "Herd & Cycle",
  "Financing",
  "Documents",
  "Review",
];

const checklistItems = [
  "Lot details confirmed",
  "Herd & cycle metrics reviewed",
  "Financing terms aligned",
  "Documents uploaded",
];

export function CreateLotReviewSubmitScreen() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<LotDraft | null>(null);
  const [submitError, setSubmitError] = useState("");
  const createLot = useCreateLot();
  const storeDraft = useLotDraftStore(state => state.draft);
  const resetDraft = useLotDraftStore(state => state.resetDraft);

  const transition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    [prefersReducedMotion],
  );

  useEffect(() => {
    setDraft(storeDraft);
  }, [storeDraft]);

  const handleSubmit = async () => {
    setIsModalOpen(false);
    setSubmitError("");

    const latestDraft = storeDraft;
    setDraft(latestDraft);

    const parsed = LotDraftSchema.safeParse(latestDraft);
    if (!parsed.success) {
      setSubmitError("Missing or invalid data. Please review the form.");
      return;
    }

    // Map productionType to backend enum format
    const productionTypeMap: Record<string, "FEEDLOT" | "PASTURE" | "MIXED"> = {
      feedlot: "FEEDLOT",
      pasture: "PASTURE",
      mixed: "MIXED",
    };

    const payload = {
      producerId: parsed.data.producerId,
      name: parsed.data.basicInfo.lotName,
      description: `${parsed.data.basicInfo.farmName} - ${parsed.data.basicInfo.productionType}`,

      // Location & Operation
      farmName: parsed.data.basicInfo.farmName,
      location: parsed.data.basicInfo.location,
      productionType: productionTypeMap[parsed.data.basicInfo.productionType] ?? "FEEDLOT",

      // Herd data
      cattleCount: parseInt(parsed.data.herdCycle.cattleCount, 10) || 0,
      averageWeightKg: parseFloat(parsed.data.herdCycle.averageWeightKg) || 0,
      initialWeightKg: parseFloat(parsed.data.herdCycle.initialWeightKg) || 0,
      durationWeeks: parseInt(parsed.data.herdCycle.durationWeeks, 10) || 0,
      startDate: parsed.data.basicInfo.startDate || undefined,
      endDate: parsed.data.herdCycle.targetEndDate || undefined,

      // Financing terms
      totalShares: parsed.data.financing.totalCapital,
      pricePerShare: "1",
      investorPercent: parsed.data.financing.investorPercent,
      fundingDeadline: parsed.data.financing.fundingDeadline || undefined,
      operatingCosts: parsed.data.financing.operatingCosts || undefined,

      // Optional
      notes: parsed.data.herdCycle.notes || undefined,
    };

    try {
      await createLot.mutateAsync(payload);
      resetDraft();
      router.push("/producer/lots/submitted");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create lot.";
      setSubmitError(message);
    }
  };

  const summary = draft ?? storeDraft;

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className="space-y-8"
    >
      <ProducerWizardStepper steps={STEPS} currentStep={4} />

      <header>
        <h1 className="font-playfair text-4xl font-semibold text-vaca-neutral-gray-900">
          Review & submit
        </h1>
        <p className="mt-2 text-sm text-vaca-neutral-gray-500">
          Confirm the details below before sending for approval.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
            Basic info
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-vaca-neutral-gray-600">
            <li>Lot: {summary.basicInfo.lotName || "—"}</li>
            <li>Farm: {summary.basicInfo.farmName || "—"}</li>
            <li>Location: {summary.basicInfo.location || "—"}</li>
            <li>Start date: {summary.basicInfo.startDate || "—"}</li>
          </ul>
        </div>

        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
            Herd & cycle
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-vaca-neutral-gray-600">
            <li>
              Number of cattle: {summary.herdCycle.cattleCount || "—"}
            </li>
            <li>
              Average weight: {summary.herdCycle.averageWeightKg || "—"} kg
            </li>
            <li>
              Initial weight: {summary.herdCycle.initialWeightKg || "—"} kg
            </li>
            <li>
              Timeline:{" "}
              {summary.herdCycle.timelineMode === "date"
                ? summary.herdCycle.targetEndDate || "—"
                : summary.herdCycle.durationWeeks
                  ? `${summary.herdCycle.durationWeeks} weeks`
                  : "—"}
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
            Financing
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-vaca-neutral-gray-600">
            <li>
              Total capital required:{" "}
              {summary.financing.totalCapital
                ? `$${summary.financing.totalCapital}`
                : "—"}
            </li>
            <li>
              Investor allocation: {summary.financing.investorPercent ?? 0}%
            </li>
            <li>
              Funding deadline: {summary.financing.fundingDeadline || "—"}
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
            Documents status
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-vaca-neutral-gray-600">
            <li>
              Ownership / operation proof:{" "}
              {summary.documents.ownership ? "Uploaded" : "Missing"}
            </li>
            <li>
              Lot documentation:{" "}
              {summary.documents.lotDocs ? "Uploaded" : "Missing"}
            </li>
            <li>
              Insurance:{" "}
              {summary.documents.insurance ? "Uploaded" : "Optional"}
            </li>
            <li>
              Producer intro video:{" "}
              {summary.documents.video ? "Uploaded" : "Optional"}
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl border-l-4 border-vaca-green bg-vaca-neutral-white p-5 text-sm text-vaca-neutral-gray-600">
        <h3 className="font-semibold text-vaca-green">Submission checklist</h3>
        <ul className="mt-3 space-y-2">
          {checklistItems.map(item => (
            <li key={item} className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-vaca-green/10 text-vaca-green">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {submitError && (
        <div className="rounded-lg border border-vaca-brown/30 bg-vaca-brown/5 p-3 text-sm text-vaca-brown">
          {submitError}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/producer/lots/new/documents"
          className="btn btn-ghost text-vaca-neutral-gray-600"
        >
          Back
        </Link>
        <button
          type="button"
          className={cn(
            "btn btn-primary w-full sm:w-auto",
            "border-vaca-green bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-blue focus-visible:ring-offset-2 focus-visible:ring-offset-vaca-neutral-bg",
            createLot.isPending && "pointer-events-none opacity-70",
          )}
          onClick={() => setIsModalOpen(true)}
        >
          {createLot.isPending ? "Submitting..." : "Submit for approval"}
        </button>
      </div>

      {isModalOpen && (
        <dialog
          open
          className="modal"
          aria-labelledby="submit-confirmation-title"
        >
          <div className="modal-box">
            <h3
              id="submit-confirmation-title"
              className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900"
            >
              Confirm submission
            </h3>
            <p className="mt-3 text-sm text-vaca-neutral-gray-600">
              You can’t change core parameters after approval without re-review.
            </p>
            <div className="modal-action flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={cn(
                  "btn btn-primary",
                  "border-vaca-green bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark",
                  createLot.isPending && "pointer-events-none opacity-70",
                )}
                onClick={handleSubmit}
              >
                {createLot.isPending ? "Submitting..." : "Submit for approval"}
              </button>
            </div>
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
            onClick={() => setIsModalOpen(false)}
          >
            <button aria-label="Close modal">close</button>
          </form>
        </dialog>
      )}
    </motion.div>
  );
}
