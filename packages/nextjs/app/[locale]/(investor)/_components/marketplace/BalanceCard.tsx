"use client";

import { ArrowDownToLine, ArrowUpFromLine, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "~~/components/ui/Badge";
import { Button } from "~~/components/ui/Button";
import { formatCurrency } from "~~/lib/utils/formatCurrency";
import { formatStrkWei } from "~~/utils/scaffold-stark/common";

export interface BalanceCardProps {
  activeTab: "fiat" | "crypto";
  fiatAvailableCentavos: number;
  strkBalance: string;
  isLoading?: boolean;
  onDeposit: () => void;
  onFund: () => void;
  onWithdraw: () => void;
}

export function BalanceCard({
  activeTab,
  fiatAvailableCentavos,
  strkBalance,
  isLoading = false,
  onDeposit,
  onFund,
  onWithdraw,
}: BalanceCardProps) {
  const t = useTranslations("investor.trade");
  const isFiat = activeTab === "fiat";

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-vaca-neutral-gray-50 to-white border border-vaca-neutral-gray-100 px-5 py-5 space-y-4">
        <div className="h-5 w-28 animate-pulse rounded bg-vaca-neutral-gray-100" />
        <div className="h-8 w-40 animate-pulse rounded bg-vaca-neutral-gray-100" />
        <div className="flex gap-3">
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-vaca-neutral-gray-100" />
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-vaca-neutral-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border px-5 py-5 space-y-3 ${
        isFiat
          ? "border-vaca-green/15 bg-gradient-to-br from-vaca-green/[0.03] to-white"
          : "border-vaca-brown/15 bg-gradient-to-br from-vaca-brown/[0.03] to-white"
      }`}
    >
      <h3 className="font-playfair text-lg font-bold text-vaca-neutral-gray-700">
        {t("balance")}
      </h3>

      <div className="flex flex-col items-center gap-1">
        {isFiat ? (
          <Badge tone="success" size="sm">
            {t("custody")}
          </Badge>
        ) : (
          <Badge
            tone="warning"
            size="sm"
            icon={<Lock className="h-2.5 w-2.5" />}
          >
            {t("private")}
          </Badge>
        )}
        <p
          className={`text-3xl font-bold tracking-tight ${isFiat ? "text-vaca-green" : "text-vaca-brown"}`}
        >
          {isFiat
            ? formatCurrency(fiatAvailableCentavos, "ARS")
            : `${formatStrkWei(strkBalance)} STRK`}
        </p>
      </div>

      <div className="flex gap-3 pt-1">
        <Button
          variant="outline"
          colorScheme={isFiat ? "green" : "brown"}
          size="sm"
          icon={<ArrowDownToLine className="h-3.5 w-3.5" />}
          iconPosition="left"
          onClick={isFiat ? onDeposit : onFund}
          className="flex-1"
        >
          {t("deposit")}
        </Button>
        <Button
          variant="outline"
          colorScheme="neutral"
          size="sm"
          icon={<ArrowUpFromLine className="h-3.5 w-3.5" />}
          iconPosition="left"
          onClick={isFiat ? undefined : onWithdraw}
          disabled={isFiat}
          title={isFiat ? t("comingSoon") : undefined}
          className="flex-1"
        >
          {t("withdraw")}
        </Button>
      </div>
    </div>
  );
}
