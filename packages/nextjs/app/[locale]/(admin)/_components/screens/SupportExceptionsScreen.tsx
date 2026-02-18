"use client";

import { useState } from "react";
import { AdminPageHeader, DataTable, StatusPill, type AdminStatusTone } from "../index";
import { cn } from "~~/lib/utils/cn";

interface TicketRecord {
  id: string;
  user: string;
  subject: string;
  status: "Open" | "In progress" | "Resolved";
  priority: "Low" | "Medium" | "High";
  updatedAt: string;
}

const tickets: TicketRecord[] = [
  {
    id: "T-118",
    user: "Investor - Carla M.",
    subject: "Withdrawal request delay",
    status: "Open",
    priority: "High",
    updatedAt: "Jan 20, 2026",
  },
  {
    id: "T-114",
    user: "Producer - Martinez Farm",
    subject: "Document upload issue",
    status: "In progress",
    priority: "Medium",
    updatedAt: "Jan 18, 2026",
  },
  {
    id: "T-109",
    user: "Investor - Diego R.",
    subject: "Portfolio value discrepancy",
    status: "Resolved",
    priority: "Low",
    updatedAt: "Jan 14, 2026",
  },
];

const exceptions = [
  "Missing documents",
  "Disputed update",
  "Settlement mismatch",
];

const statusTone: Record<TicketRecord["status"], AdminStatusTone> = {
  Open: "pending",
  "In progress": "info",
  Resolved: "approved",
};

/**
 * SupportExceptionsScreen (ADMIN-10)
 * Support tickets and exception handling.
 */
export function SupportExceptionsScreen() {
  const [activeTab, setActiveTab] = useState<"tickets" | "exceptions">(
    "tickets",
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Support & Exceptions" />

      <div className="flex flex-wrap gap-2">
        {[
          { id: "tickets", label: "Tickets" },
          { id: "exceptions", label: "Exceptions" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as "tickets" | "exceptions")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold",
                isActive
                  ? "border-vaca-green/40 bg-vaca-green/10 text-vaca-green"
                  : "border-vaca-neutral-gray-200 text-vaca-neutral-gray-600",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "tickets" ? (
        <>
          <div className="space-y-3 sm:hidden">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-vaca-neutral-gray-900">
                      {ticket.user}
                    </p>
                    <p className="text-xs text-vaca-neutral-gray-500">
                      {ticket.subject}
                    </p>
                  </div>
                  <StatusPill
                    label={ticket.status}
                    tone={statusTone[ticket.status]}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-vaca-neutral-gray-500">
                  <span>Priority {ticket.priority}</span>
                  <span>Updated {ticket.updatedAt}</span>
                </div>
                <button
                  type="button"
                  className="mt-3 rounded-full border border-vaca-neutral-gray-200 px-3 py-1 text-[11px] font-semibold text-vaca-neutral-gray-700"
                >
                  Open
                </button>
              </div>
            ))}
          </div>

          <div className="hidden sm:block">
            <DataTable caption="Support tickets" ariaLabel="Support tickets">
              <thead className="border-b border-vaca-neutral-gray-100 text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Updated at</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-vaca-neutral-gray-100 text-sm text-vaca-neutral-gray-700"
                  >
                    <td className="px-4 py-3 font-semibold text-vaca-neutral-gray-900">
                      {ticket.user}
                    </td>
                    <td className="px-4 py-3">{ticket.subject}</td>
                    <td className="px-4 py-3">
                      <StatusPill
                        label={ticket.status}
                        tone={statusTone[ticket.status]}
                      />
                    </td>
                    <td className="px-4 py-3">{ticket.priority}</td>
                    <td className="px-4 py-3">{ticket.updatedAt}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="rounded-full border border-vaca-neutral-gray-200 px-3 py-1 text-xs font-semibold text-vaca-neutral-gray-700 transition hover:border-vaca-neutral-gray-300"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {exceptions.map((item) => (
            <div
              key={item}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white px-4 py-3 text-sm"
            >
              <div>
                <p className="font-semibold text-vaca-neutral-gray-900">
                  {item}
                </p>
                <p className="text-xs text-vaca-neutral-gray-500">
                  Requires manual exception handling.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full border border-vaca-neutral-gray-200 px-3 py-1 text-xs font-semibold text-vaca-neutral-gray-700 transition hover:border-vaca-neutral-gray-300"
                >
                  Assign to me
                </button>
                <button
                  type="button"
                  className="rounded-full border border-vaca-green/40 px-3 py-1 text-xs font-semibold text-vaca-green transition hover:border-vaca-green"
                >
                  Mark resolved
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
