"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AuditNote, ReviewPanel, StatusPill } from "../index";
import { cn } from "~~/lib/utils/cn";

interface DocumentItem {
  label: string;
  status: "Complete" | "Missing" | "Pending";
  href: string;
}

const documents: DocumentItem[] = [
  { label: "Producer registration", status: "Complete", href: "#" },
  { label: "Insurance certificate", status: "Pending", href: "#" },
  { label: "Animal health report", status: "Missing", href: "#" },
];

const lots = [
  {
    id: "102",
    name: "Angus Growth Lot",
    location: "Cordoba, AR",
    status: "Funding",
    nav: "$410,000",
  },
  {
    id: "118",
    name: "Grass-fed Breeding",
    location: "Santa Fe, AR",
    status: "In review",
    nav: "$275,000",
  },
];

const documentTone = {
  Complete: "approved",
  Pending: "pending",
  Missing: "flagged",
} as const;

const modalCopy = {
  approve: {
    title: "Confirm approval",
    description: "Approve this producer and unlock lot creation.",
    primary: "Approve producer",
  },
  reject: {
    title: "Confirm rejection",
    description: "Rejecting requires a reason for audit purposes.",
    primary: "Reject producer",
  },
} as const;

/**
 * ProducerDetailScreen (ADMIN-04)
 * Detailed review of a single producer.
 */
export function ProducerDetailScreen() {
  const [status, setStatus] = useState<"Pending" | "Approved" | "Rejected">(
    "Pending",
  );
  const [modalAction, setModalAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");
  const modalRef = useRef<HTMLDivElement | null>(null);

  const tone = useMemo(() => {
    if (status === "Approved") return "approved";
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      setModalAction(null);
      setError("");
      setRejectReason("");
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

  const confirmAction = () => {
    if (modalAction === "reject" && rejectReason.trim().length === 0) {
      setError("Rejection reason is required.");
      return;
    }

    if (modalAction === "approve") {
      setStatus("Approved");
    }
    if (modalAction === "reject") {
      setStatus("Rejected");
    }
    setModalAction(null);
    setError("");
    setRejectReason("");
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Martinez Farm"
        subtitle="Producer review and onboarding verification."
        actions={<StatusPill label={status} tone={tone} />}
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-vaca-neutral-gray-900">
              Producer profile
            </h2>
            <dl className="mt-4 grid gap-4 text-sm text-vaca-neutral-gray-600 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  Location
                </dt>
                <dd className="mt-1 font-semibold text-vaca-neutral-gray-900">
                  Cordoba, AR
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  Years operating
                </dt>
                <dd className="mt-1 font-semibold text-vaca-neutral-gray-900">
                  12 years
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  Primary contact
                </dt>
                <dd className="mt-1 font-semibold text-vaca-neutral-gray-900">
                  Sofia Martinez
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  Phone
                </dt>
                <dd className="mt-1 font-semibold text-vaca-neutral-gray-900">
                  +54 11 5555 1212
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-5 shadow-sm">
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
                  <StatusPill label={doc.status} tone={documentTone[doc.status]} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-vaca-neutral-gray-900">
              Lots by this producer
            </h2>
            <div className="mt-4 space-y-3">
              {lots.map((lot) => (
                <LotRowCard key={lot.id} {...lot} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ReviewPanel
            description="Approve to unlock listings, or request changes if verification is incomplete."
          >
            <button
              type="button"
              onClick={() => setModalAction("approve")}
              className="w-full rounded-full bg-vaca-green px-4 py-2 text-sm font-semibold text-vaca-neutral-white shadow-sm transition hover:bg-vaca-green-dark"
            >
              Approve producer
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
              Reject
            </button>
          </ReviewPanel>

          <AuditNote />
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

            {modalAction === "reject" ? (
              <div className="mt-4">
                <label className="text-sm font-semibold text-vaca-neutral-gray-800">
                  Rejection reason
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-lg border border-vaca-neutral-gray-200 px-3 py-2 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </div>
            ) : null}

            {error ? (
              <p className="mt-2 text-xs text-red-600">{error}</p>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalAction(null);
                  setError("");
                  setRejectReason("");
                }}
                className="rounded-full border border-vaca-neutral-gray-200 px-4 py-2 text-xs font-semibold text-vaca-neutral-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAction}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold text-vaca-neutral-white",
                  modalAction === "approve"
                    ? "bg-vaca-green"
                    : "bg-red-600",
                )}
              >
                {modalCopy[modalAction].primary}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface LotRowCardProps {
  id: string;
  name: string;
  location: string;
  status: string;
  nav: string;
}

function LotRowCard({ id, name, location, status, nav }: LotRowCardProps) {
  return (
    <Link
      href={`/admin/lots/${id}`}
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-gray-50 px-4 py-3 text-sm"
    >
      <div>
        <p className="font-semibold text-vaca-neutral-gray-900">{name}</p>
        <p className="text-xs text-vaca-neutral-gray-500">{location}</p>
      </div>
      <div className="text-right">
        <p className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
          {status}
        </p>
        <p className="font-semibold text-vaca-neutral-gray-900">{nav}</p>
      </div>
    </Link>
  );
}
