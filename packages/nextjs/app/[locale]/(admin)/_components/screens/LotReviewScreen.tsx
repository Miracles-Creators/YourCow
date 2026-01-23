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
import { useAnimalsByLot } from "~~/hooks/animals/useAnimalsByLot";
import { useApproveAnimals } from "~~/hooks/animals/useApproveAnimals";
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

const producerStatusLabelMap: Record<string, string> = {
  ACTIVE: "Approved",
  SUSPENDED: "Suspended",
  REJECTED: "Rejected",
  PENDING: "Pending",
};

const producerStatusToneMap: Record<string, AdminStatusTone> = {
  ACTIVE: "approved",
  SUSPENDED: "neutral",
  REJECTED: "rejected",
  PENDING: "pending",
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
  const approveLot = useApproveLot();
  const isApproving = approveLot.isPending;
  const animalsQuery = useAnimalsByLot(lotId);
  const approveAnimals = useApproveAnimals();
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<number[]>([]);
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [approveData, setApproveData] = useState({
    tokenName: "",
    tokenSymbol: "",
    totalShares: 0,
    pricePerShare: 0,
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

  const producerName = lotQuery.data?.producer?.user?.name ?? "Producer";
  const producerId = lotQuery.data?.producer?.userId;
  const producerHref = producerId ? `/admin/producers/${producerId}` : "#";
  const producerStatus = lotQuery.data?.producer?.status ?? "";
  const producerStatusLabel = useMemo(
    () => producerStatusLabelMap[producerStatus] ?? "Unknown",
    [producerStatus],
  );
  const producerStatusTone = useMemo<AdminStatusTone>(
    () => producerStatusToneMap[producerStatus] ?? "neutral",
    [producerStatus],
  );

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

  // Filter animals by approval status
  const pendingAnimals = useMemo(
    () => animalsQuery.data?.filter(a => a.approvalStatus === "PENDING_APPROVAL") ?? [],
    [animalsQuery.data],
  );

  const approvedAnimals = useMemo(
    () => animalsQuery.data?.filter(a => a.approvalStatus === "APPROVED") ?? [],
    [animalsQuery.data],
  );
  const canApproveAnimals = Boolean(
    lotQuery.data?.onChainLotId &&
      (lotQuery.data?.status === "FUNDING" || lotQuery.data?.status === "ACTIVE"),
  );

  const toggleAnimalSelection = (animalId: number) => {
    setSelectedAnimalIds(prev =>
      prev.includes(animalId)
        ? prev.filter(id => id !== animalId)
        : [...prev, animalId],
    );
  };

  const selectAllPendingAnimals = () => {
    if (selectedAnimalIds.length === pendingAnimals.length) {
      setSelectedAnimalIds([]);
    } else {
      setSelectedAnimalIds(pendingAnimals.map(a => a.id));
    }
  };

  const handleApproveAnimals = async () => {
    if (selectedAnimalIds.length === 0 || !canApproveAnimals) return;

    let notificationId: string | null = null;
    try {
      notificationId = notification.loading("Approving animals and registering on-chain...");
      await approveAnimals.mutateAsync({
        animalIds: selectedAnimalIds,
        lotId,
      });
      if (notificationId) notification.remove(notificationId);
      notification.success(`${selectedAnimalIds.length} animal(s) approved and registered on-chain.`);
      setSelectedAnimalIds([]);
      queryClient.invalidateQueries({ queryKey: ["animals", "lot", lotId] });
    } catch (err) {
      if (notificationId) notification.remove(notificationId);
      notification.error(err instanceof Error ? err.message : "Failed to approve animals.");
    }
  };

  const totalCapital = useMemo(() => {
    if (!lotQuery.data) return null;
    return lotQuery.data.totalShares * lotQuery.data.pricePerShare;
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
        !approveData.totalShares ||
        !approveData.pricePerShare
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
            totalShares: approveData.totalShares,
            pricePerShare: approveData.pricePerShare,
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
              href={producerHref}
              className="text-sm font-semibold text-vaca-blue hover:text-vaca-blue-dark"
            >
              {producerName}
            </Link>
            <StatusPill label={producerStatusLabel} tone={producerStatusTone} />
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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-vaca-neutral-gray-900">
                Animals pending approval
              </h2>
              <span className="text-xs font-semibold uppercase tracking-wide text-vaca-neutral-gray-500">
                {pendingAnimals.length} pending
              </span>
            </div>

            {animalsQuery.isLoading && (
              <p className="mt-4 text-sm text-vaca-neutral-gray-500">Loading animals...</p>
            )}

            {animalsQuery.isError && (
              <p className="mt-4 text-sm text-red-600">Failed to load animals.</p>
            )}

            {!animalsQuery.isLoading && pendingAnimals.length === 0 && (
              <p className="mt-4 text-sm text-vaca-neutral-gray-500">
                No animals pending approval.
              </p>
            )}

            {pendingAnimals.length > 0 && (
              <>
                {!canApproveAnimals && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p className="font-semibold">Animals cannot be approved yet.</p>
                    <p className="mt-1 text-xs text-amber-800">
                      The lot must be approved and deployed on-chain first (status
                      <span className="font-semibold"> FUNDING</span> or
                      <span className="font-semibold"> ACTIVE</span> with an on-chain lot id).
                    </p>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-vaca-neutral-gray-600">
                    <input
                      type="checkbox"
                      checked={selectedAnimalIds.length === pendingAnimals.length}
                      onChange={selectAllPendingAnimals}
                      disabled={!canApproveAnimals}
                      className="h-4 w-4 rounded border-vaca-neutral-gray-300 text-vaca-green focus:ring-vaca-green"
                    />
                    Select all ({pendingAnimals.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleApproveAnimals}
                    disabled={
                      selectedAnimalIds.length === 0 || approveAnimals.isPending || !canApproveAnimals
                    }
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                      selectedAnimalIds.length > 0 && canApproveAnimals
                        ? "bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark"
                        : "cursor-not-allowed bg-vaca-neutral-gray-200 text-vaca-neutral-gray-400",
                    )}
                  >
                    {approveAnimals.isPending
                      ? "Approving..."
                      : `Approve selected (${selectedAnimalIds.length})`}
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {pendingAnimals.map(animal => {
                    const profile = animal.profile as { breed?: string } | null;
                    const initialWeightKg =
                      typeof animal.initialWeightGrams === "number"
                        ? (animal.initialWeightGrams / 1000).toFixed(1)
                        : null;
                    return (
                      <div
                        key={animal.id}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border px-4 py-3 transition",
                          selectedAnimalIds.includes(animal.id)
                            ? "border-vaca-green/40 bg-vaca-green/5"
                            : "border-vaca-neutral-gray-100 bg-vaca-neutral-gray-50",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAnimalIds.includes(animal.id)}
                          onChange={() => toggleAnimalSelection(animal.id)}
                          disabled={!canApproveAnimals}
                          className="h-4 w-4 rounded border-vaca-neutral-gray-300 text-vaca-green focus:ring-vaca-green"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-vaca-neutral-gray-900">
                            EID: {animal.eid}
                          </p>
                          <p className="text-xs text-vaca-neutral-gray-500">
                            {profile?.breed ?? "Unknown breed"}
                            {initialWeightKg ? ` · ${initialWeightKg} kg` : ""}
                            {" · Custodian: "}
                            {animal.custodian.slice(0, 10)}...
                          </p>
                        </div>
                        <StatusPill
                          label="Pending"
                          tone="pending"
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {approvedAnimals.length > 0 && (
              <div className="mt-6 border-t border-vaca-neutral-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-vaca-neutral-gray-500">
                  Already approved ({approvedAnimals.length})
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {approvedAnimals.slice(0, 5).map(animal => (
                    <span
                      key={animal.id}
                      className="rounded-full bg-vaca-green/10 px-3 py-1 text-xs font-medium text-vaca-green"
                    >
                      {animal.eid}
                    </span>
                  ))}
                  {approvedAnimals.length > 5 && (
                    <span className="rounded-full bg-vaca-neutral-gray-100 px-3 py-1 text-xs font-medium text-vaca-neutral-gray-500">
                      +{approvedAnimals.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
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
                  placeholder="Total shares"
                  type="number"
                  min={1}
                  step={1}
                  value={approveData.totalShares || ""}
                  onChange={event =>
                    setApproveData(prev => ({
                      ...prev,
                      totalShares: Number(event.target.value),
                    }))
                  }
                />
                <input
                  className="w-full rounded-full border border-vaca-neutral-gray-200 px-3 py-2 text-sm"
                  placeholder="Price per share"
                  type="number"
                  min={1}
                  step={1}
                  value={approveData.pricePerShare || ""}
                  onChange={event =>
                    setApproveData(prev => ({
                      ...prev,
                      pricePerShare: Number(event.target.value),
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
