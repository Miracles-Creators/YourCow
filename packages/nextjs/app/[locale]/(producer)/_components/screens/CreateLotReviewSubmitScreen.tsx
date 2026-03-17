"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "~~/lib/utils/cn";
import { ProducerWizardStepper } from "../ui/ProducerWizardStepper";
import {
  LotDraftSchema,
  useLotDraftStore,
  type LotDraft,
} from "~~/services/store/lotDraft";
import { useCreateLot } from "~~/hooks/lots/useCreateLot";

export function CreateLotReviewSubmitScreen() {
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
  const checklistItems = [
    t("review.checklist.items.lotDetails"),
    t("review.checklist.items.herdCycle"),
    t("review.checklist.items.financing"),
    t("review.checklist.items.documents"),
  ];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<LotDraft | null>(null);
  const [submitError, setSubmitError] = useState("");
  const createLot = useCreateLot();
  const storeDraft = useLotDraftStore((state) => state.draft);
  const resetDraft = useLotDraftStore((state) => state.resetDraft);

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
      setSubmitError(t("review.errors.invalidData"));
      return;
    }

    // Map productionType to backend enum format
    const productionTypeMap: Record<string, "FEEDLOT" | "PASTURE" | "MIXED"> = {
      feedlot: "FEEDLOT",
      pasture: "PASTURE",
      mixed: "MIXED",
    };
    //TODO REFACTOR THIS
    const payload = {
      producerId: parsed.data.producerId,
      name: parsed.data.basicInfo.lotName,
      description: `${parsed.data.basicInfo.farmName} - ${parsed.data.basicInfo.productionType}`,

      // Location & Operation
      farmName: parsed.data.basicInfo.farmName,
      location: parsed.data.basicInfo.location,
      productionType:
        productionTypeMap[parsed.data.basicInfo.productionType] ?? "FEEDLOT",

      // Herd data
      cattleCount: parsed.data.herdCycle.cattleCount,
      averageWeightKg: parsed.data.herdCycle.averageWeightKg,
      initialWeightKg: parsed.data.herdCycle.initialWeightKg,
      durationWeeks: parsed.data.herdCycle.durationWeeks,
      startDate: parsed.data.basicInfo.startDate || undefined,
      endDate: parsed.data.herdCycle.targetEndDate || undefined,

      // Financing terms (set by admin)
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
      <ProducerWizardStepper steps={steps} currentStep={4} />

      <header>
        <h1 className="font-playfair text-4xl font-semibold text-vaca-neutral-gray-900">
          {t("review.title")}
        </h1>
        <p className="mt-2 text-sm text-vaca-neutral-gray-500">
          {t("review.subtitle")}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
            {t("review.sections.basicInfo.title")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-vaca-neutral-gray-600">
            <li>{t("review.sections.basicInfo.lot")}: {summary.basicInfo.lotName || "—"}</li>
            <li>{t("review.sections.basicInfo.farm")}: {summary.basicInfo.farmName || "—"}</li>
            <li>{t("review.sections.basicInfo.location")}: {summary.basicInfo.location || "—"}</li>
            <li>{t("review.sections.basicInfo.startDate")}: {summary.basicInfo.startDate || "—"}</li>
          </ul>
        </div>

        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
            {t("review.sections.herdCycle.title")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-vaca-neutral-gray-600">
            <li>{t("review.sections.herdCycle.cattleCount")}: {summary.herdCycle.cattleCount || "—"}</li>
            <li>
              {t("review.sections.herdCycle.averageWeight")}: {summary.herdCycle.averageWeightKg || "—"} kg
            </li>
            <li>
              {t("review.sections.herdCycle.initialWeight")}: {summary.herdCycle.initialWeightKg || "—"} kg
            </li>
            <li>
              {t("review.sections.herdCycle.timeline")}:{" "}
              {summary.herdCycle.timelineMode === "date"
                ? summary.herdCycle.targetEndDate || "—"
                : summary.herdCycle.durationWeeks
                  ? `${summary.herdCycle.durationWeeks} ${t("review.sections.herdCycle.weeks")}`
                  : "—"}
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
            {t("review.sections.financing.title")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-vaca-neutral-gray-600">
            <li>
              {t("review.sections.financing.totalCapital")}:{" "}
              {summary.financing.totalCapital
                ? `$${summary.financing.totalCapital}`
                : "—"}
            </li>
            <li>
              {t("review.sections.financing.investorAllocation")}: {summary.financing.investorPercent ?? 0}%
            </li>
            <li>
              {t("review.sections.financing.fundingDeadline")}: {summary.financing.fundingDeadline || "—"}
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
            {t("review.sections.documents.title")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-vaca-neutral-gray-600">
            <li>
              {t("review.sections.documents.ownership")}:{" "}
              {summary.documents.ownership ? t("review.sections.documents.uploaded") : t("review.sections.documents.missing")}
            </li>
            <li>
              {t("review.sections.documents.lotDocs")}:{" "}
              {summary.documents.lotDocs ? t("review.sections.documents.uploaded") : t("review.sections.documents.missing")}
            </li>
            <li>
              {t("review.sections.documents.insurance")}: {summary.documents.insurance ? t("review.sections.documents.uploaded") : t("review.sections.documents.optional")}
            </li>
            <li>
              {t("review.sections.documents.video")}:{" "}
              {summary.documents.video ? t("review.sections.documents.uploaded") : t("review.sections.documents.optional")}
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl border-l-4 border-vaca-green bg-vaca-neutral-white p-5 text-sm text-vaca-neutral-gray-600">
        <h3 className="font-semibold text-vaca-green">{t("review.checklist.title")}</h3>
        <ul className="mt-3 space-y-2">
          {checklistItems.map((item) => (
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
          {t("review.buttons.back")}
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
          {createLot.isPending ? t("review.buttons.submitting") : t("review.buttons.submit")}
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
              {t("review.modal.title")}
            </h3>
            <p className="mt-3 text-sm text-vaca-neutral-gray-600">
              {t("review.modal.description")}
            </p>
            <div className="modal-action flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsModalOpen(false)}
              >
                {t("review.modal.cancel")}
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
                {createLot.isPending ? t("review.modal.submitting") : t("review.modal.submit")}
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
