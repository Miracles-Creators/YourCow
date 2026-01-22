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
import { useProducers } from "~~/hooks/producers/useProducers";

interface ProducerRecord {
  id: string;
  name: string;
  location: string;
  status: "Pending" | "Approved" | "Rejected";
  lotsCount: number;
  lastActivity: string;
}

const filters = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const statusTone: Record<ProducerRecord["status"], AdminStatusTone> = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
};

const formatActivityDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const mapProducerStatus = (status: string): ProducerRecord["status"] => {
  if (status === "ACTIVE") return "Approved";
  if (status === "REJECTED" || status === "SUSPENDED") return "Rejected";
  return "Pending";
};

/**
 * ProducersListScreen (ADMIN-03)
 * List and filter producers with review actions.
 */
export function ProducersListScreen() {
  const router = useRouter();
  const producersQuery = useProducers();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const dataProducers: ProducerRecord[] = useMemo(
    () =>
      (producersQuery.data ?? []).map((producer) => {
        const lastActivitySource =
          producer.lots?.reduce<string | null>((latest, lot) => {
            if (!lot.updatedAt) return latest;
            if (!latest) return lot.updatedAt;
            return new Date(lot.updatedAt) > new Date(latest)
              ? lot.updatedAt
              : latest;
          }, null) ?? null;

        return {
          id: producer.userId.toString(),
          name: producer.user.name ?? "-",
          location: producer.location ?? "-",
          status: mapProducerStatus(producer.status),
          lotsCount: producer.lots?.length ?? 0,
          lastActivity: formatActivityDate(lastActivitySource),
        };
      }),
    [producersQuery.data],
  );

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return dataProducers.filter((producer) => {
      const matchesFilter =
        activeFilter === "all" ||
        producer.status.toLowerCase() === activeFilter;
      const matchesQuery =
        query.length === 0 ||
        producer.name.toLowerCase().includes(query) ||
        producer.location.toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, dataProducers, searchTerm]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Producers"
        actions={
          <button
            type="button"
            className="rounded-full border border-vaca-neutral-gray-200 px-4 py-2 text-xs font-semibold text-vaca-neutral-gray-700 transition hover:border-vaca-neutral-gray-300"
          >
            Export
          </button>
        }
      />

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
            placeholder="Search by name or location"
            aria-label="Search producers by name or location"
            className="w-full rounded-full border border-vaca-neutral-gray-200 bg-vaca-neutral-white px-4 py-2 text-sm text-vaca-neutral-gray-700 focus:border-vaca-blue focus:outline-none focus:ring-2 focus:ring-vaca-blue/20"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No producers found"
          description="Try adjusting your filters or search terms."
        />
      ) : (
        <>
          <div className="space-y-3 sm:hidden">
            {filtered.map((producer) => (
              <button
                key={producer.id}
                type="button"
                onClick={() => router.push(`/admin/producers/${producer.id}`)}
                className="w-full rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-4 text-left shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-vaca-neutral-gray-900">
                      {producer.name}
                    </p>
                    <p className="text-xs text-vaca-neutral-gray-500">
                      {producer.location}
                    </p>
                  </div>
                  <StatusPill
                    label={producer.status}
                    tone={statusTone[producer.status]}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-vaca-neutral-gray-500">
                  <span>{producer.lotsCount} lots</span>
                  <span>Last activity {producer.lastActivity}</span>
                </div>
                <span className="mt-3 inline-flex rounded-full border border-vaca-neutral-gray-200 px-3 py-1 text-[11px] font-semibold text-vaca-neutral-gray-700">
                  Review
                </span>
              </button>
            ))}
          </div>

          <div className="hidden sm:block">
            <DataTable caption="Producers list" ariaLabel="Producers list">
              <thead className="border-b border-vaca-neutral-gray-100 text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                <tr>
                  <th className="px-4 py-3">Producer name</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Lots</th>
                  <th className="px-4 py-3">Last activity</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((producer) => (
                  <tr
                    key={producer.id}
                    className="cursor-pointer border-b border-vaca-neutral-gray-100 text-sm text-vaca-neutral-gray-700 hover:bg-vaca-neutral-gray-50"
                    onClick={() =>
                      router.push(`/admin/producers/${producer.id}`)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/admin/producers/${producer.id}`);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label={`Review ${producer.name}`}
                  >
                    <td className="px-4 py-3 font-semibold text-vaca-neutral-gray-900">
                      {producer.name}
                    </td>
                    <td className="px-4 py-3">{producer.location}</td>
                    <td className="px-4 py-3">
                      <StatusPill
                        label={producer.status}
                        tone={statusTone[producer.status]}
                      />
                    </td>
                    <td className="px-4 py-3">{producer.lotsCount}</td>
                    <td className="px-4 py-3">{producer.lastActivity}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/producers/${producer.id}`}
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
