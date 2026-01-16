"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader, DataTable, FilterChips, StatusPill, type AdminStatusTone } from "../index";
import { cn } from "~~/lib/utils/cn";

type UpdateStatus = "Pending" | "Verified" | "Flagged";

interface UpdateRecord {
  id: string;
  date: string;
  lot: string;
  type: "Weight" | "Health" | "Feeding" | "Event";
  summary: string;
  status: UpdateStatus;
  details: string;
  hasPhoto?: boolean;
}

const updatesSeed: UpdateRecord[] = [
  {
    id: "U-455",
    date: "Jan 20, 2026",
    lot: "Angus Growth Lot",
    type: "Weight",
    summary: "Avg +18kg in 14 days",
    status: "Pending",
    details: "Weights captured across 240 head. 3 outliers flagged for review.",
    hasPhoto: true,
  },
  {
    id: "U-448",
    date: "Jan 18, 2026",
    lot: "Grass-fed Breeding",
    type: "Health",
    summary: "Vaccination batch completed",
    status: "Verified",
    details: "Full vaccination protocol completed and logged.",
  },
  {
    id: "U-441",
    date: "Jan 16, 2026",
    lot: "Dairy Expansion",
    type: "Feeding",
    summary: "Feed ration adjusted for winter",
    status: "Flagged",
    details: "Ration change exceeded threshold; verify feed supplier notes.",
  },
];

const filters = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending verification" },
  { id: "verified", label: "Verified" },
  { id: "flagged", label: "Flagged" },
];

const statusTone: Record<UpdateStatus, AdminStatusTone> = {
  Pending: "pending",
  Verified: "approved",
  Flagged: "flagged",
};

const flagReasons = [
  "Missing documentation",
  "Data inconsistency",
  "Photo mismatch",
  "Other",
];

/**
 * UpdatesReviewScreen (ADMIN-07)
 * Review and verify producer updates.
 */
export function UpdatesReviewScreen() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [updates, setUpdates] = useState<UpdateRecord[]>(updatesSeed);
  const [selectedUpdate, setSelectedUpdate] = useState<UpdateRecord | null>(
    updatesSeed[0] ?? null,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [flagging, setFlagging] = useState<UpdateRecord | null>(null);
  const [flagReason, setFlagReason] = useState(flagReasons[0]);
  const [flagNotes, setFlagNotes] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => {
    return updates.filter((update) => {
      if (activeFilter === "all") return true;
      return update.status.toLowerCase() === activeFilter;
    });
  }, [activeFilter, updates]);

  const handleVerify = (id: string) => {
    setUpdates((prev) =>
      prev.map((update) =>
        update.id === id ? { ...update, status: "Verified" } : update,
      ),
    );
    setToast("Update verified");
  };

  const handleFlag = () => {
    if (!flagging) return;
    setUpdates((prev) =>
      prev.map((update) =>
        update.id === flagging.id ? { ...update, status: "Flagged" } : update,
      ),
    );
    setFlagging(null);
    setFlagNotes("");
    setToast("Update flagged");
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Updates Review" />

      <FilterChips
        options={filters}
        activeId={activeFilter}
        onSelect={setActiveFilter}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="space-y-3 sm:hidden">
            {filtered.map((update) => (
              <div
                key={update.id}
                onClick={() => setSelectedUpdate(update)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedUpdate(update);
                  }
                }}
                role="button"
                tabIndex={0}
                className="w-full rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-4 text-left shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-vaca-neutral-gray-500">
                      {update.date}
                    </p>
                    <p className="mt-1 font-semibold text-vaca-neutral-gray-900">
                      {update.lot}
                    </p>
                    <p className="text-xs text-vaca-neutral-gray-500">
                      {update.type} · {update.summary}
                    </p>
                  </div>
                  <StatusPill
                    label={update.status}
                    tone={statusTone[update.status]}
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleVerify(update.id);
                    }}
                    className="rounded-full border border-vaca-green/40 px-3 py-1 text-[11px] font-semibold text-vaca-green"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFlagging(update);
                      setFlagReason(flagReasons[0]);
                      setFlagNotes("");
                    }}
                    className="rounded-full border border-red-200 px-3 py-1 text-[11px] font-semibold text-red-700"
                  >
                    Flag
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block">
            <DataTable caption="Updates review" ariaLabel="Updates review">
              <thead className="border-b border-vaca-neutral-gray-100 text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Lot</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((update) => (
                  <tr
                    key={update.id}
                    className="cursor-pointer border-b border-vaca-neutral-gray-100 text-sm text-vaca-neutral-gray-700 hover:bg-vaca-neutral-gray-50"
                    onClick={() => setSelectedUpdate(update)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedUpdate(update);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open details for ${update.lot}`}
                  >
                    <td className="px-4 py-3 text-xs text-vaca-neutral-gray-500">
                      {update.date}
                    </td>
                    <td className="px-4 py-3 font-semibold text-vaca-neutral-gray-900">
                      {update.lot}
                    </td>
                    <td className="px-4 py-3">{update.type}</td>
                    <td className="px-4 py-3 text-vaca-neutral-gray-500">
                      {update.summary}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill
                        label={update.status}
                        tone={statusTone[update.status]}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleVerify(update.id);
                          }}
                          className="rounded-full border border-vaca-green/40 px-3 py-1 text-xs font-semibold text-vaca-green transition hover:border-vaca-green"
                        >
                          Verify
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setFlagging(update);
                            setFlagReason(flagReasons[0]);
                            setFlagNotes("");
                          }}
                          className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:border-red-300"
                        >
                          Flag
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
        </div>

        <aside className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-vaca-neutral-gray-900">
            Update details
          </h2>
          {selectedUpdate ? (
            <div className="mt-4 space-y-3 text-sm text-vaca-neutral-gray-600">
              <div>
                <p className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  Lot
                </p>
                <p className="font-semibold text-vaca-neutral-gray-900">
                  {selectedUpdate.lot}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  Summary
                </p>
                <p>{selectedUpdate.details}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  Status
                </p>
                <StatusPill
                  label={selectedUpdate.status}
                  tone={statusTone[selectedUpdate.status]}
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                  Photo preview
                </p>
                <div className="mt-2 flex h-32 items-center justify-center rounded-xl border border-dashed border-vaca-neutral-gray-200 bg-vaca-neutral-gray-50 text-xs text-vaca-neutral-gray-500">
                  {selectedUpdate.hasPhoto ? "Photo attached" : "No photo"}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-vaca-neutral-gray-500">
              Select an update to see details.
            </p>
          )}
        </aside>
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-40 rounded-full bg-vaca-neutral-gray-900 px-4 py-2 text-xs font-semibold text-vaca-neutral-white shadow-lg">
          {toast}
        </div>
      ) : null}

      {flagging ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Flag update"
        >
          <div className="w-full max-w-md rounded-2xl bg-vaca-neutral-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-vaca-neutral-gray-900">
              Flag update
            </h3>
            <p className="mt-2 text-sm text-vaca-neutral-gray-500">
              Provide a reason and notes for audit tracking.
            </p>

            <div className="mt-4 space-y-3">
              <label className="text-sm font-semibold text-vaca-neutral-gray-800">
                Reason
              </label>
              <select
                value={flagReason}
                onChange={(event) => setFlagReason(event.target.value)}
                className="w-full rounded-lg border border-vaca-neutral-gray-200 px-3 py-2 text-sm focus:border-vaca-blue focus:outline-none focus:ring-2 focus:ring-vaca-blue/20"
              >
                {flagReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>

              <label className="text-sm font-semibold text-vaca-neutral-gray-800">
                Notes
              </label>
              <textarea
                value={flagNotes}
                onChange={(event) => setFlagNotes(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-vaca-neutral-gray-200 px-3 py-2 text-sm focus:border-vaca-blue focus:outline-none focus:ring-2 focus:ring-vaca-blue/20"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setFlagging(null)}
                className="rounded-full border border-vaca-neutral-gray-200 px-4 py-2 text-xs font-semibold text-vaca-neutral-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFlag}
                className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-vaca-neutral-white"
              >
                Confirm flag
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
