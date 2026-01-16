"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AdminPageHeader,
  DataTable,
  EmptyState,
  FilterChips,
  StatusPill,
  type AdminStatusTone,
} from "../index";

interface LotRecord {
  id: string;
  name: string;
  producer: string;
  status: "Pending" | "Active" | "Sold" | "Settled" | "Paused";
  fundedPercent: number;
  lastUpdate: string;
  needsAttention?: boolean;
}

const lots: LotRecord[] = [
  {
    id: "102",
    name: "Angus Growth Lot",
    producer: "Martinez Farm",
    status: "Pending",
    fundedPercent: 72,
    lastUpdate: "Jan 18, 2026",
    needsAttention: true,
  },
  {
    id: "118",
    name: "Grass-fed Breeding",
    producer: "Horizon Cattle Co.",
    status: "Active",
    fundedPercent: 88,
    lastUpdate: "Jan 20, 2026",
  },
  {
    id: "131",
    name: "Dairy Expansion",
    producer: "Los Pinos Ranch",
    status: "Paused",
    fundedPercent: 45,
    lastUpdate: "Jan 09, 2026",
    needsAttention: true,
  },
  {
    id: "144",
    name: "Winter Feedlot",
    producer: "Delta Plains",
    status: "Settled",
    fundedPercent: 100,
    lastUpdate: "Dec 29, 2025",
  },
];

const filters = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "active", label: "Active" },
  { id: "sold", label: "Sold" },
  { id: "settled", label: "Settled" },
  { id: "paused", label: "Paused" },
];

const statusTone: Record<LotRecord["status"], AdminStatusTone> = {
  Pending: "pending",
  Active: "approved",
  Sold: "asset",
  Settled: "info",
  Paused: "neutral",
};

/**
 * LotsListScreen (ADMIN-05)
 * List and filter investment lots.
 */
export function LotsListScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return lots.filter((lot) => {
      const matchesFilter =
        activeFilter === "all" || lot.status.toLowerCase() === activeFilter;
      const matchesQuery =
        query.length === 0 ||
        lot.name.toLowerCase().includes(query) ||
        lot.producer.toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, searchTerm]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Lots" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips
          options={filters}
          activeId={activeFilter}
          onSelect={setActiveFilter}
        />
        <div className="relative w-full max-w-sm">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search lots or producers"
            aria-label="Search lots by name or producer"
            className="w-full rounded-full border border-vaca-neutral-gray-200 bg-vaca-neutral-white px-4 py-2 text-sm text-vaca-neutral-gray-700 focus:border-vaca-blue focus:outline-none focus:ring-2 focus:ring-vaca-blue/20"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No lots found"
          description="Try adjusting filters or search terms."
        />
      ) : (
        <>
          <div className="space-y-3 sm:hidden">
            {filtered.map((lot) => (
              <button
                key={lot.id}
                type="button"
                onClick={() => router.push(`/admin/lots/${lot.id}`)}
                className="w-full rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-4 text-left shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-vaca-neutral-gray-900">
                      {lot.name}
                    </p>
                    <p className="text-xs text-vaca-neutral-gray-500">
                      {lot.producer}
                    </p>
                  </div>
                  <StatusPill label={lot.status} tone={statusTone[lot.status]} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-vaca-neutral-gray-500">
                  <span>Funded {lot.fundedPercent}%</span>
                  <span>{lot.lastUpdate}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  {lot.needsAttention ? (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                      Attention
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="rounded-full border border-vaca-neutral-gray-200 px-3 py-1 text-[11px] font-semibold text-vaca-neutral-gray-700">
                    Review
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="hidden sm:block">
            <DataTable caption="Lots list" ariaLabel="Lots list">
              <thead className="border-b border-vaca-neutral-gray-100 text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                <tr>
                  <th className="px-4 py-3">Lot name</th>
                  <th className="px-4 py-3">Producer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Funded %</th>
                  <th className="px-4 py-3">Last update</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lot) => (
                  <tr
                    key={lot.id}
                    className="cursor-pointer border-b border-vaca-neutral-gray-100 text-sm text-vaca-neutral-gray-700 hover:bg-vaca-neutral-gray-50"
                    onClick={() => router.push(`/admin/lots/${lot.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/admin/lots/${lot.id}`);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label={`Review ${lot.name}`}
                  >
                    <td className="px-4 py-3 font-semibold text-vaca-neutral-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{lot.name}</span>
                        {lot.needsAttention ? (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            Attention
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">{lot.producer}</td>
                    <td className="px-4 py-3">
                      <StatusPill
                        label={lot.status}
                        tone={statusTone[lot.status]}
                      />
                    </td>
                    <td className="px-4 py-3">{lot.fundedPercent}%</td>
                    <td className="px-4 py-3">{lot.lastUpdate}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/lots/${lot.id}`}
                        className="rounded-full border border-vaca-neutral-gray-200 px-3 py-1 text-xs font-semibold text-vaca-neutral-gray-700 transition hover:border-vaca-neutral-gray-300"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
        </>
      )}
    </div>
  );
}
