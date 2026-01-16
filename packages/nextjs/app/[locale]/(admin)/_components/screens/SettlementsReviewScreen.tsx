"use client";

import { useState } from "react";
import { AdminPageHeader, DataTable, StatusPill, type AdminStatusTone } from "../index";
import { cn } from "~~/lib/utils/cn";

interface SettlementRecord {
  id: string;
  lot: string;
  saleDate: string;
  grossAmount: string;
  finalCosts: string;
  netResult: string;
  status: "Pending" | "Confirmed";
}

const settlementsSeed: SettlementRecord[] = [
  {
    id: "S-91",
    lot: "Angus Growth Lot",
    saleDate: "Jan 12, 2026",
    grossAmount: "$510,000",
    finalCosts: "$42,500",
    netResult: "$467,500",
    status: "Pending",
  },
  {
    id: "S-87",
    lot: "Grass-fed Breeding",
    saleDate: "Jan 05, 2026",
    grossAmount: "$390,000",
    finalCosts: "$36,900",
    netResult: "$353,100",
    status: "Confirmed",
  },
];

const statusTone: Record<SettlementRecord["status"], AdminStatusTone> = {
  Pending: "pending",
  Confirmed: "approved",
};

/**
 * SettlementsReviewScreen (ADMIN-09)
 * Review and confirm settlement details.
 */
export function SettlementsReviewScreen() {
  const [settlements, setSettlements] = useState(settlementsSeed);
  const [active, setActive] = useState<SettlementRecord | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!active || !confirmed) return;
    setSettlements((prev) =>
      prev.map((item) =>
        item.id === active.id ? { ...item, status: "Confirmed" } : item,
      ),
    );
    setActive(null);
    setConfirmed(false);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Settlements" />

      <div className="space-y-3 sm:hidden">
        {settlements.map((settlement) => (
          <button
            key={settlement.id}
            type="button"
            onClick={() => setActive(settlement)}
            className="w-full rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-4 text-left shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-vaca-neutral-gray-900">
                  {settlement.lot}
                </p>
                <p className="text-xs text-vaca-neutral-gray-500">
                  Sale date {settlement.saleDate}
                </p>
              </div>
              <StatusPill
                label={settlement.status}
                tone={statusTone[settlement.status]}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-vaca-neutral-gray-500">
              <span>Gross {settlement.grossAmount}</span>
              <span>Costs {settlement.finalCosts}</span>
              <span className="col-span-2 text-vaca-neutral-gray-900">
                Net {settlement.netResult}
              </span>
            </div>
            <span className="mt-3 inline-flex rounded-full border border-vaca-neutral-gray-200 px-3 py-1 text-[11px] font-semibold text-vaca-neutral-gray-700">
              Review
            </span>
          </button>
        ))}
      </div>

      <div className="hidden sm:block">
        <DataTable caption="Settlements review" ariaLabel="Settlements review">
          <thead className="border-b border-vaca-neutral-gray-100 text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
            <tr>
              <th className="px-4 py-3">Lot</th>
              <th className="px-4 py-3">Sale date</th>
              <th className="px-4 py-3">Gross sale amount</th>
              <th className="px-4 py-3">Final costs</th>
              <th className="px-4 py-3">Net result</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((settlement) => (
              <tr
                key={settlement.id}
                className="border-b border-vaca-neutral-gray-100 text-sm text-vaca-neutral-gray-700"
              >
                <td className="px-4 py-3 font-semibold text-vaca-neutral-gray-900">
                  {settlement.lot}
                </td>
                <td className="px-4 py-3">{settlement.saleDate}</td>
                <td className="px-4 py-3">{settlement.grossAmount}</td>
                <td className="px-4 py-3">{settlement.finalCosts}</td>
                <td className="px-4 py-3">{settlement.netResult}</td>
                <td className="px-4 py-3">
                  <StatusPill
                    label={settlement.status}
                    tone={statusTone[settlement.status]}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setActive(settlement)}
                    className="rounded-full border border-vaca-neutral-gray-200 px-3 py-1 text-xs font-semibold text-vaca-neutral-gray-700 transition hover:border-vaca-neutral-gray-300"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Settlement review"
        >
          <div className="w-full max-w-lg rounded-2xl bg-vaca-neutral-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-vaca-neutral-gray-900">
              Settlement review
            </h3>
            <p className="mt-2 text-sm text-vaca-neutral-gray-500">
              Verify the breakdown before confirming settlement.
            </p>

            <div className="mt-4 space-y-2 text-sm text-vaca-neutral-gray-700">
              <div className="flex items-center justify-between">
                <span>Lot</span>
                <span className="font-semibold text-vaca-neutral-gray-900">
                  {active.lot}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Gross sale</span>
                <span>{active.grossAmount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Final costs</span>
                <span>{active.finalCosts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Net result</span>
                <span className="font-semibold text-vaca-neutral-gray-900">
                  {active.netResult}
                </span>
              </div>
            </div>

            <label className="mt-4 flex items-center gap-2 text-xs font-semibold text-vaca-neutral-gray-700">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="h-4 w-4 rounded border-vaca-neutral-gray-300 text-vaca-green focus:ring-vaca-green"
              />
              I confirm the values were reviewed
            </label>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setActive(null);
                  setConfirmed(false);
                }}
                className="rounded-full border border-vaca-neutral-gray-200 px-4 py-2 text-xs font-semibold text-vaca-neutral-gray-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!confirmed}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold text-vaca-neutral-white",
                  confirmed
                    ? "bg-vaca-green"
                    : "bg-vaca-neutral-gray-300 cursor-not-allowed",
                )}
              >
                Confirm settlement
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
