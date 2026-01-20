"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader, ReviewPanel, StatusPill, type AdminStatusTone } from "../index";
import { cn } from "~~/lib/utils/cn";
import { useLot } from "~~/hooks/lots/useLot";
import { useApproveLot } from "~~/hooks/lots/useApproveLot";
import { notification } from "~~/utils/scaffold-stark/notification";

type LotStatus = "Pending" | "Active" | "Paused" | "Rejected";

type ModalAction = "approve" | "reject" | "pause" | null;

interface DocumentItem {
  label: string;
  status: "Complete" | "Missing" | "Pending";
  href: string;
}

const documents: DocumentItem[] = [
  { label: "Health certificate", status: "Complete", href: "#" },
  { label: "Insurance proof", status: "Missing", href: "#" },
  { label: "Weigh-in report", status: "Pending", href: "#" },
];

const documentTone: Record<DocumentItem["status"], AdminStatusTone> = {
  Complete: "approved",
  Missing: "flagged",
  Pending: "pending",
};

const modalCopy = {
  approve: {
    title: "Confirm approval",
    description: "Approve this lot and publish it to the marketplace.",
    primary: "Approve lot",
  },
  reject: {
    title: "Confirm rejection",
    description: "Rejection requires a reason for audit purposes.",
    primary: "Reject lot",
  },
  pause: {
    title: "Confirm pause",
    description: "Pausing requires a reason and hides the lot from investors.",
    primary: "Pause lot",
  },
} as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
  },
};

/**
 * LotReviewScreen (ADMIN-06)
 * Detailed review of a single lot.
 */
export function LotReviewScreen() {
  const params = useParams();
  const lotId = typeof params.id === "string" ? Number(params.id) : 0;
  const lotQuery = useLot(lotId);
  const queryClient = useQueryClient();
  console.log(lotQuery, "lotQuery", lotId, "lotId");
  const approveLot = useApproveLot();
  const isApproving = approveLot.isPending;
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [approveData, setApproveData] = useState({
    tokenName: "",
    tokenSymbol: "",
    initialPricePerShare: "",
    producerAddress: "",
  });
  const modalRef = useRef<HTMLDivElement | null>(null);

  const mapStatus = (lotStatus?: string): LotStatus => {
    if (lotStatus === "ACTIVE" || lotStatus === "FUNDING" || lotStatus === "COMPLETED") {
      return "Active";
    }
    return "Pending";
  };

  const status = useMemo<LotStatus>(() => mapStatus(lotQuery.data?.status), [lotQuery.data?.status]);

  const statusTone = useMemo<AdminStatusTone>(() => {
    if (status === "Active") return "approved";
    if (status === "Paused") return "neutral";
    if (status === "Rejected") return "rejected";
    return "pending";
  }, [status]);

  useEffect(() => {
    if (!modalAction) return;
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
      "button, textarea",
    );
    firstFocusable?.focus();
  }, [modalAction]);

  const closeModal = () => {
    setModalAction(null);
    setReason("");
    setError("");
  };

  const totalCapital = useMemo(() => {
    if (!lotQuery.data) return null;
    const totalShares = Number(lotQuery.data.totalShares);
    const pricePerShare = Number(lotQuery.data.pricePerShare);
    if (!Number.isFinite(totalShares) || !Number.isFinite(pricePerShare)) return null;
    return totalShares * pricePerShare;
  }, [lotQuery.data]);

  const formattedTotalCapital = useMemo(() => {
    if (totalCapital === null) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
      totalCapital,
    );
  }, [totalCapital]);

  const handleConfirm = async () => {
    if ((modalAction === "reject" || modalAction === "pause") && !reason.trim()) {
      setError("Reason is required.");
      return;
    }

    if (modalAction === "approve") {
      if (!lotId) {
        setError("Lot ID missing.");
        return;
      }
      if (
        !approveData.tokenName ||
        !approveData.tokenSymbol ||
        !approveData.initialPricePerShare
      ) {
        setError("All approval fields are required.");
        return;
      }
      let notificationId: string | null = null;
      try {
        notificationId = notification.loading("Deploying lot on-chain...");
        const updatedLot = await approveLot.mutateAsync({
          lotId,
          data: {
            tokenName: approveData.tokenName,
            tokenSymbol: approveData.tokenSymbol,
            initialPricePerShare: approveData.initialPricePerShare,
            producerAddress: approveData.producerAddress || undefined,
          },
        });
        if (notificationId) notification.remove(notificationId);
        notification.success("Lot approved and published.");
        queryClient.setQueryData(["lots", lotId], updatedLot);
      } catch (err) {
        if (notificationId) notification.remove(notificationId);
        setError(err instanceof Error ? err.message : "Approval failed.");
        notification.error("Approval failed. Check the error message for details.");
        return;
      }
    }
    if (modalAction === "reject") {
        setError("");
      }
    if (modalAction === "pause") {
      setError("");
    }
    closeModal();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      closeModal();
    }

    if (event.key === "Tab" && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        "button, textarea",
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <AdminPageHeader
        title={lotQuery.data?.name ?? "Lot"}
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/admin/producers/unknown"
              className="text-sm font-semibold text-vaca-blue hover:text-vaca-blue-dark"
            >
              Producer
            </Link>
            <StatusPill label={status} tone={statusTone} />
          </div>
        }
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <motion.div
            variants={sectionVariants}
            className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-vaca-neutral-gray-900">
              Lot overview
            </h2>
            <dl className="mt-4 grid gap-4 text-sm text-vaca-neutral-gray-600 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  Location
                </dt>
                <dd className="mt-1 font-semibold text-vaca-neutral-gray-900">
                  {lotQuery.data?.location ??
                    "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  Production type
                </dt>
                <dd className="mt-1 font-semibold text-vaca-neutral-gray-900">
                  {lotQuery.data?.productionType ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  Cattle count
                </dt>
                <dd className="mt-1 font-semibold text-vaca-neutral-gray-900">
                  {lotQuery.data?.cattleCount ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  Start date
                </dt>
                <dd className="mt-1 font-semibold text-vaca-neutral-gray-900">
                  {lotQuery.data?.startDate ? new Date(lotQuery.data.startDate).toLocaleDateString() : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  Duration
                </dt>
                <dd className="mt-1 font-semibold text-vaca-neutral-gray-900">
                  {lotQuery.data?.durationWeeks
                    ? `${lotQuery.data?.durationWeeks} weeks`
                    : "—"}
                </dd>
              </div>
            </dl>
          </motion.div>

          <motion.div
            variants={sectionVariants}
            className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-vaca-neutral-gray-900">
              Financial structure
            </h2>
            <dl className="mt-4 grid gap-4 text-sm text-vaca-neutral-gray-600 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  Total capital required
                </dt>
                <dd className="mt-1 font-semibold text-vaca-neutral-gray-900">
                  {formattedTotalCapital}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  % offered
                </dt>
                <dd className="mt-1 font-semibold text-vaca-neutral-gray-900">
                  {lotQuery.data?.investorPercent ?? "—"}%
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  Funding deadline
                </dt>
                <dd className="mt-1 font-semibold text-vaca-neutral-gray-900">
                  {lotQuery.data?.fundingDeadline
                    ? new Date(lotQuery.data.fundingDeadline).toLocaleDateString()
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  Estimated costs
                </dt>
                <dd className="mt-1 font-semibold text-vaca-neutral-gray-900">
                  {lotQuery.data?.operatingCosts ?? "—"}
                </dd>
              </div>
            </dl>
          </motion.div>

          <motion.div
            variants={sectionVariants}
            className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-vaca-neutral-gray-900">
                Documents
              </h2>
              <span className="text-xs font-semibold uppercase tracking-wide text-vaca-neutral-gray-500">
                3 items
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.label}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-vaca-neutral-gray-900">
                      {doc.label}
                    </p>
                    <Link
                      href={doc.href}
                      className="text-xs text-vaca-blue hover:text-vaca-blue-dark"
                    >
                      View document
                    </Link>
                  </div>
                  <StatusPill
                    label={doc.status}
                    tone={documentTone[doc.status]}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={sectionVariants}
            className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-vaca-neutral-gray-900">
              Producer presentation
            </h2>
            <div className="mt-4 rounded-xl border border-dashed border-vaca-neutral-gray-200 bg-vaca-neutral-gray-50 px-4 py-6 text-sm text-vaca-neutral-gray-500">
              Video placeholder — upload required for approval.
            </div>
          </motion.div>

          <motion.div
            variants={sectionVariants}
            className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-vaca-neutral-gray-900">
                Investor preview
              </h2>
              <span className="rounded-full bg-vaca-blue/10 px-3 py-1 text-xs font-semibold text-vaca-blue">
                What investors will see
              </span>
            </div>
            <div className="mt-4 rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-gray-50 p-4">
              <p className="font-playfair text-lg font-semibold text-vaca-neutral-gray-900">
                {lotQuery.data?.name ?? "—"}
              </p>
              <p className="mt-1 text-sm text-vaca-neutral-gray-500">
                {lotQuery.data?.location ?? "—"} · {lotQuery.data?.cattleCount ?? "—"} head ·{" "}
                {lotQuery.data?.durationWeeks ?? "—"} weeks
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-vaca-neutral-gray-600">
                <span>Investor %: {lotQuery.data?.investorPercent ?? "—"}%</span>
                <span>Funding: {lotQuery.data?.fundedPercent ?? "—"}%</span>
                <span>Price/share: {lotQuery.data?.pricePerShare ?? "—"}</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          {status === "Active" ? (
            <div className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-5 shadow-sm">
              {/* TODO: Wire pause flow (API + on-chain) and refresh lot state after success. */}
              <button
                type="button"
                onClick={() => setModalAction("pause")}
                className="w-full rounded-full border border-vaca-brown/40 px-4 py-2 text-sm font-semibold text-vaca-brown transition hover:border-vaca-brown"
              >
                Pause lot
              </button>
            </div>
          ) : (
            <ReviewPanel description="Approve to publish, or request changes before making this lot visible.">
              <div className="space-y-3">
                <input
                  className="w-full rounded-full border border-vaca-neutral-gray-200 px-3 py-2 text-sm"
                  placeholder="Token name"
                  value={approveData.tokenName}
                  onChange={event =>
                    setApproveData(prev => ({ ...prev, tokenName: event.target.value }))
                  }
                />
                <input
                  className="w-full rounded-full border border-vaca-neutral-gray-200 px-3 py-2 text-sm"
                  placeholder="Token symbol"
                  value={approveData.tokenSymbol}
                  onChange={event =>
                    setApproveData(prev => ({ ...prev, tokenSymbol: event.target.value }))
                  }
                />
                <input
                  className="w-full rounded-full border border-vaca-neutral-gray-200 px-3 py-2 text-sm"
                  placeholder="Initial price per share"
                  value={approveData.initialPricePerShare}
                  onChange={event =>
                    setApproveData(prev => ({
                      ...prev,
                      initialPricePerShare: event.target.value,
                    }))
                  }
                />
                <input
                  className="w-full rounded-full border border-vaca-neutral-gray-200 px-3 py-2 text-sm"
                  placeholder="Producer address (optional)"
                  value={approveData.producerAddress}
                  onChange={event =>
                    setApproveData(prev => ({
                      ...prev,
                      producerAddress: event.target.value,
                    }))
                  }
                />
              </div>
              <button
                type="button"
                onClick={() => setModalAction("approve")}
                disabled={isApproving}
                className="w-full rounded-full bg-vaca-green px-4 py-2 text-sm font-semibold text-vaca-neutral-white shadow-sm transition hover:bg-vaca-green-dark"
              >
                {isApproving ? "Approving..." : "Approve lot"}
              </button>
              <button
                type="button"
                className="w-full rounded-full border border-vaca-blue/40 px-4 py-2 text-sm font-semibold text-vaca-blue transition hover:border-vaca-blue"
              >
                Request changes
              </button>
              <button
                type="button"
                onClick={() => setModalAction("reject")}
                className="w-full rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300"
              >
                Reject lot
              </button>
            </ReviewPanel>
          )}

          <div className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-vaca-neutral-gray-900">
              Risk flags
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-vaca-neutral-gray-600">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                Funding % unusually high for stage
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                Missing insurance certificate
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                Weight data inconsistent week-over-week
              </li>
            </ul>
          </div>
        </div>
      </section>

      {modalAction ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-label={modalCopy[modalAction].title}
          onKeyDown={handleKeyDown}
        >
          <div
            ref={modalRef}
            className="w-full max-w-md rounded-2xl bg-vaca-neutral-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-vaca-neutral-gray-900">
              {modalCopy[modalAction].title}
            </h3>
            <p className="mt-2 text-sm text-vaca-neutral-gray-500">
              {modalCopy[modalAction].description}
            </p>

            {modalAction !== "approve" ? (
              <div className="mt-4">
                <label className="text-sm font-semibold text-vaca-neutral-gray-800">
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-lg border border-vaca-neutral-gray-200 px-3 py-2 text-sm focus:border-vaca-brown focus:outline-none focus:ring-2 focus:ring-vaca-brown/20"
                />
              </div>
            ) : null}

            {error ? (
              <p className="mt-2 text-xs text-red-600">{error}</p>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-vaca-neutral-gray-200 px-4 py-2 text-xs font-semibold text-vaca-neutral-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isApproving}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold text-vaca-neutral-white",
                  modalAction === "approve"
                    ? "bg-vaca-green"
                    : modalAction === "pause"
                      ? "bg-vaca-brown"
                      : "bg-red-600",
                )}
              >
                {modalAction === "approve" && isApproving
                  ? "Approving..."
                  : modalCopy[modalAction].primary}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
