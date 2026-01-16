import Link from "next/link";
import { cn } from "~~/lib/utils/cn";
import { FundingProgress } from "./FundingProgress";
import { StatusPill, type StatusTone } from "./StatusPill";

interface LotRowCardProps {
  name: string;
  statusLabel: string;
  statusTone?: StatusTone;
  fundedPercent: number;
  lastUpdate: string;
  manageHref: string;
  className?: string;
}

export function LotRowCard({
  name,
  statusLabel,
  statusTone = "neutral",
  fundedPercent,
  lastUpdate,
  manageHref,
  className,
}: LotRowCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2">
          <h3 className="truncate font-playfair text-lg font-semibold text-vaca-neutral-gray-900">
            {name}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-vaca-neutral-gray-500">
            <StatusPill label={statusLabel} tone={statusTone} />
            <span className="text-xs uppercase tracking-wide">
              Last update:{" "}
              <span className="font-semibold text-vaca-neutral-gray-700">
                {lastUpdate}
              </span>
            </span>
          </div>
        </div>

        <div className="w-full lg:max-w-xs">
          <FundingProgress value={fundedPercent} />
        </div>

        <div className="flex justify-end">
          <Link
            href={manageHref}
            className={cn(
              "btn btn-sm btn-outline bg-transparent",
              "border-vaca-blue text-vaca-blue hover:bg-vaca-blue/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-blue focus-visible:ring-offset-2 focus-visible:ring-offset-vaca-neutral-bg",
            )}
            aria-label={`Manage ${name}`}
          >
            Manage
          </Link>
        </div>
      </div>
    </div>
  );
}
