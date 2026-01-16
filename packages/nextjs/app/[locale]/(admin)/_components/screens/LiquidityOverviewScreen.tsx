import { AdminPageHeader, StatusPill } from "../index";

const exitActivity = [
  {
    id: "A-201",
    lot: "Angus Growth Lot",
    action: "Exit request matched",
    date: "Jan 20, 2026",
  },
  {
    id: "A-199",
    lot: "Grass-fed Breeding",
    action: "Settlement confirmed",
    date: "Jan 18, 2026",
  },
  {
    id: "A-192",
    lot: "Dairy Expansion",
    action: "Exit request submitted",
    date: "Jan 15, 2026",
  },
];

/**
 * LiquidityOverviewScreen (ADMIN-08)
 * Oversight of liquidity windows and exit requests.
 */
export function LiquidityOverviewScreen() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Liquidity" />

      <section className="rounded-2xl border border-vaca-blue/20 bg-vaca-neutral-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
              Current window status
            </p>
            <h2 className="mt-2 font-playfair text-2xl font-semibold text-vaca-blue">
              Open
            </h2>
          </div>
          <StatusPill label="Monitoring" tone="pending" />
        </div>
        <div className="mt-4 rounded-xl border border-vaca-blue/20 bg-vaca-blue/5 px-4 py-3 text-sm text-vaca-blue">
          Monitor matching and settlement flow.
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Pending exits" value="18" />
        <SummaryCard label="Matched" value="9" />
        <SummaryCard label="Settled" value="6" />
      </section>

      <section className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-vaca-neutral-gray-900">
          Recent exit activity
        </h2>
        <div className="mt-4 space-y-3">
          {exitActivity.map((item) => (
            <ActivityRow key={item.id} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
}

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
        {label}
      </p>
      <p className="mt-2 font-playfair text-2xl font-semibold text-vaca-neutral-gray-900">
        {value}
      </p>
    </div>
  );
}

interface ActivityRowProps {
  id: string;
  lot: string;
  action: string;
  date: string;
}

function ActivityRow({ lot, action, date }: ActivityRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-gray-50 px-4 py-3 text-sm">
      <div>
        <p className="font-semibold text-vaca-neutral-gray-900">{lot}</p>
        <p className="text-xs text-vaca-neutral-gray-500">{action}</p>
      </div>
      <span className="text-xs text-vaca-neutral-gray-500">{date}</span>
    </div>
  );
}
