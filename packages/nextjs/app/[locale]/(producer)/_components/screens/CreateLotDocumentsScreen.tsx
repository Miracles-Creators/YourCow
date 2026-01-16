"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "~~/lib/utils/cn";
import { ProducerWizardStepper } from "../ui/ProducerWizardStepper";
import { UploadDropzone } from "../ui/UploadDropzone";

type DocumentKey = "ownership" | "lotDocs" | "insurance" | "video";

const STEPS = [
  "Basic Info",
  "Herd & Cycle",
  "Financing",
  "Documents",
  "Review",
];

export function CreateLotDocumentsScreen() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [uploadProgress, setUploadProgress] = useState<
    Record<DocumentKey, number | null>
  >({
    ownership: null,
    lotDocs: null,
    insurance: null,
    video: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const transition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    [prefersReducedMotion],
  );

  const handleUpload = (key: DocumentKey, file: File | null) => {
    if (!file) return;
    // TODO: Integrate with services/uploads.ts
    setUploadProgress(prev => ({ ...prev, [key]: 100 }));
    setErrors(prev => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!uploadProgress.ownership) {
      nextErrors.ownership = "Ownership / operation proof is required.";
    }
    if (!uploadProgress.lotDocs) {
      nextErrors.lotDocs = "Lot documentation is required.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    router.push("/producer/lots/new/review");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className="space-y-8"
    >
      <ProducerWizardStepper steps={STEPS} currentStep={3} />

      <header>
        <h1 className="font-playfair text-4xl font-semibold text-vaca-neutral-gray-900">
          Documents & presentation
        </h1>
        <p className="mt-2 text-sm text-vaca-neutral-gray-500">
          Upload the required documentation so we can complete verification.
        </p>
      </header>

      <motion.form
        onSubmit={handleSubmit}
        className="space-y-8"
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
      >
        <section className="space-y-6">
          <div>
            <h2 className="font-playfair text-2xl font-semibold text-vaca-neutral-gray-900">
              Required documents
            </h2>
            <p className="mt-2 text-sm text-vaca-neutral-gray-500">
              Provide proof of operation and documentation for the lot.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <UploadDropzone
              id="ownership-proof"
              label="Ownership / operation proof"
              helper="Business registry, land lease, or operating license."
              required
              progress={uploadProgress.ownership}
              onFileSelect={file => handleUpload("ownership", file)}
            />
            <UploadDropzone
              id="lot-docs"
              label="Lot documentation"
              helper="Health certificates, traceability, or vet reports."
              required
              progress={uploadProgress.lotDocs}
              onFileSelect={file => handleUpload("lotDocs", file)}
            />
            <UploadDropzone
              id="insurance-docs"
              label="Insurance"
              helper="Optional coverage documentation."
              progress={uploadProgress.insurance}
              onFileSelect={file => handleUpload("insurance", file)}
            />
          </div>
          {(errors.ownership || errors.lotDocs) && (
            <div className="rounded-lg border border-vaca-brown/30 bg-vaca-brown/5 p-3 text-xs text-vaca-brown">
              {errors.ownership && <p>{errors.ownership}</p>}
              {errors.lotDocs && <p>{errors.lotDocs}</p>}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-playfair text-2xl font-semibold text-vaca-neutral-gray-900">
              Meet the producer
            </h2>
            <p className="mt-2 text-sm text-vaca-neutral-gray-500">
              Optional, recommended: introduce your family/team and how you
              manage this lot.
            </p>
          </div>
          <UploadDropzone
            id="producer-video"
            label="Short video upload (max 2 minutes)"
            helper="No return promises. Keep it authentic."
            progress={uploadProgress.video}
            onFileSelect={file => handleUpload("video", file)}
          />
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/producer/lots/new/financing"
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
