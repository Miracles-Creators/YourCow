"use client";

import { Shield, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTongoBalance } from "~~/hooks/tongo";
import { formatStrkWei } from "~~/utils/scaffold-stark/common";
import { cn } from "~~/lib/utils/cn";

interface WalletBarProps {
  onFund: () => void;
  onWithdraw: () => void;
  className?: string;
}

export function WalletBar({ onFund, onWithdraw, className }: WalletBarProps) {
  const t = useTranslations("common.actions");
  const { data, isPending } = useTongoBalance();
  const current = data?.current ?? "0";

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-2xl bg-vaca-neutral-white px-5 py-3 shadow-sm border border-vaca-neutral-gray-100",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <Shield className="h-4 w-4 text-vaca-green" />
        {isPending ? (
          <div className="h-5 w-20 animate-pulse rounded bg-vaca-neutral-gray-100" />
        ) : (
          <span className="font-inter text-sm font-semibold tabular-nums text-vaca-neutral-gray-900">
            {formatStrkWei(current)} STRK
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onFund}
          className="flex items-center gap-1.5 rounded-full bg-vaca-green px-3.5 py-1.5 font-inter text-xs font-semibold text-white transition-colors hover:bg-vaca-green/90"
        >
          <ArrowDownToLine className="h-3.5 w-3.5" />
          {t("fund")}
        </button>
        <button
          onClick={onWithdraw}
          className="flex items-center gap-1.5 rounded-full border border-vaca-neutral-gray-200 bg-vaca-neutral-white px-3.5 py-1.5 font-inter text-xs font-semibold text-vaca-neutral-gray-600 transition-colors hover:bg-vaca-neutral-gray-50"
        >
          <ArrowUpFromLine className="h-3.5 w-3.5" />
          {t("withdraw")}
        </button>
      </div>
    </div>
  );
}
