"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "~~/lib/utils/cn";
import { ProducerWizardStepper } from "../ui/ProducerWizardStepper";

const STEPS = [
  "Basic Info",
  "Herd & Cycle",
  "Financing",
  "Documents",
  "Review",
];

const summary = {
  basicInfo: {
    lotName: "San Juan Feedlot - Q1",
    farmName: "Martinez Family Feedlot",
    location: "San Juan, Argentina",
    startDate: "Mar 12, 2026",
  },
  herdCycle: {
    cattle: "420 head",
    avgWeight: "285 kg",
    timeline: "24 weeks",
  },
  financing: {
    capital: "$2,850,000",
    investorShare: "35%",
    deadline: "Apr 15, 2026",
  },
  documents: {
    ownership: "Uploaded",
    lotDocs: "Uploaded",
    insurance: "Optional",
    video: "Optional",
  },
};

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

  const transition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    [prefersReducedMotion],
  );

  const handleSubmit = () => {
    setIsModalOpen(false);
    router.push("/producer/lots/submitted");
  };

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
            <li>Lot: {summary.basicInfo.lotName}</li>
            <li>Farm: {summary.basicInfo.farmName}</li>
            <li>Location: {summary.basicInfo.location}</li>
            <li>Start date: {summary.basicInfo.startDate}</li>
          </ul>
        </div>

        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
            Herd & cycle
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-vaca-neutral-gray-600">
            <li>Number of cattle: {summary.herdCycle.cattle}</li>
            <li>Average weight: {summary.herdCycle.avgWeight}</li>
            <li>Timeline: {summary.herdCycle.timeline}</li>
          </ul>
        </div>

        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
            Financing
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-vaca-neutral-gray-600">
            <li>Total capital required: {summary.financing.capital}</li>
            <li>Investor allocation: {summary.financing.investorShare}</li>
            <li>Funding deadline: {summary.financing.deadline}</li>
          </ul>
        </div>

        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
            Documents status
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-vaca-neutral-gray-600">
            <li>Ownership / operation proof: {summary.documents.ownership}</li>
            <li>Lot documentation: {summary.documents.lotDocs}</li>
            <li>Insurance: {summary.documents.insurance}</li>
            <li>Producer intro video: {summary.documents.video}</li>
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
          )}
          onClick={() => setIsModalOpen(true)}
        >
          Submit for approval
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
                )}
                onClick={handleSubmit}
              >
                Submit for approval
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
