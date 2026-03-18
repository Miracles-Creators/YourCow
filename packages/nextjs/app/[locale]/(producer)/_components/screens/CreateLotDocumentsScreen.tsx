"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "~~/lib/utils/cn";
import { ProducerWizardStepper } from "../ui/ProducerWizardStepper";
import { UploadDropzone } from "../ui/UploadDropzone";
import { useLotDraftStore } from "~~/services/store/lotDraft";

type DocumentKey = "ownership" | "lotDocs" | "insurance" | "video";

export function CreateLotDocumentsScreen() {
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
  const [uploadProgress, setUploadProgress] = useState<
    Record<DocumentKey, number | null>
  >({
    ownership: null,
    lotDocs: null,
    insurance: null,
    video: null,
  });
  const draft = useLotDraftStore((state) => state.draft);
  const updateDraft = useLotDraftStore((state) => state.updateDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setUploadProgress({
      ownership: draft.documents.ownership,
      lotDocs: draft.documents.lotDocs,
      insurance: draft.documents.insurance,
      video: draft.documents.video,
    });
  }, [draft]);

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
    setUploadProgress((prev) => ({ ...prev, [key]: 100 }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    // MVP: allow proceeding without documents to unblock end-to-end flow.
    setErrors({});
    return true;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    updateDraft({
      documents: {
        ownership: uploadProgress.ownership,
        lotDocs: uploadProgress.lotDocs,
        insurance: uploadProgress.insurance,
        video: uploadProgress.video,
      },
    });
    router.push("/producer/lots/new/review");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className="space-y-8"
    >
      <ProducerWizardStepper steps={steps} currentStep={3} />

      <header>
        <h1 className="font-playfair text-4xl font-semibold text-vaca-neutral-gray-900">
          {t("documents.title")}
        </h1>
        <p className="mt-2 text-sm text-vaca-neutral-gray-500">
          {t("documents.subtitle")}
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
              {t("documents.sections.required.title")}
            </h2>
            <p className="mt-2 text-sm text-vaca-neutral-gray-500">
              {t("documents.sections.required.subtitle")}
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <UploadDropzone
              id="ownership-proof"
              label={t("documents.fields.ownership.label")}
              helper={t("documents.fields.ownership.helper")}
              required
              progress={uploadProgress.ownership}
              onFileSelect={(file) => handleUpload("ownership", file)}
            />
            <UploadDropzone
              id="lot-docs"
              label={t("documents.fields.lotDocs.label")}
              helper={t("documents.fields.lotDocs.helper")}
              required
              progress={uploadProgress.lotDocs}
              onFileSelect={(file) => handleUpload("lotDocs", file)}
            />
            <UploadDropzone
              id="insurance-docs"
              label={t("documents.fields.insurance.label")}
              helper={t("documents.fields.insurance.helper")}
              progress={uploadProgress.insurance}
              onFileSelect={(file) => handleUpload("insurance", file)}
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
              {t("documents.sections.producer.title")}
            </h2>
            <p className="mt-2 text-sm text-vaca-neutral-gray-500">
              {t("documents.sections.producer.subtitle")}
            </p>
          </div>
          <UploadDropzone
            id="producer-video"
            label={t("documents.fields.video.label")}
            helper={t("documents.fields.video.helper")}
            progress={uploadProgress.video}
            onFileSelect={(file) => handleUpload("video", file)}
          />
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/producer/lots/new/financing"
            className="btn btn-ghost text-vaca-neutral-gray-600"
          >
            {t("documents.buttons.back")}
          </Link>
          <button
            type="submit"
            className={cn(
              "btn btn-primary w-full sm:w-auto",
              "border-vaca-green bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-blue focus-visible:ring-offset-2 focus-visible:ring-offset-vaca-neutral-bg",
            )}
          >
            {t("documents.buttons.continue")}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
