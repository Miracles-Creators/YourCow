"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Shield, Wallet } from "lucide-react";

import { Badge } from "~~/components/ui/Badge";
import { Button } from "~~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/Card";
import { useP2PPreviewStore } from "~~/services/store/p2pPreview";
import { formatStrkWei } from "~~/utils/scaffold-stark/common";

const WEI = 10n ** 18n;
const PRESET_FUND_AMOUNTS = [25n, 75n, 150n];

export function P2PPrivateBalanceFundScreen() {
  const [selectedAmountWei, setSelectedAmountWei] = useState<bigint>(PRESET_FUND_AMOUNTS[1] * WEI);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentWei = useP2PPreviewStore(state => state.currentWei);
  const pendingWei = useP2PPreviewStore(state => state.pendingWei);
  const fundBalance = useP2PPreviewStore(state => state.fundBalance);

  const projectedBalance = (BigInt(currentWei) + selectedAmountWei).toString();

  const handleConfirm = () => {
    fundBalance(selectedAmountWei.toString());
    setIsCompleted(true);
  };

  return (
    <div className="mx-auto max-w-4xl pb-12">
      <div className="pt-4">
        <Button
          href="/p2p-v2"
          variant="ghost"
          colorScheme="neutral"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          iconPosition="left"
          className="-ml-3"
        >
          Back to marketplace
        </Button>

        <div className="mt-4">
          <Badge tone="success" size="md" icon={<Shield className="h-3.5 w-3.5" />}>
            Private balance setup
          </Badge>
          <h1 className="mt-4 font-playfair text-4xl font-bold tracking-tight text-vaca-neutral-gray-900">
            Fund your private balance
          </h1>
          <p className="mt-2 max-w-2xl font-inter text-sm font-light text-vaca-neutral-gray-500">
            This step deserves its own screen. It is not trading yet. It prepares the encrypted balance
            you will use inside the marketplace.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card variant="elevated" padding="lg" className="border border-vaca-neutral-gray-100">
          <CardHeader className="mb-5">
            <CardTitle size="md">Choose deposit amount</CardTitle>
            <p className="mt-1 text-sm text-vaca-neutral-gray-500">
              Review-first flow. Reuses the same client styles but keeps the funding step focused.
            </p>
          </CardHeader>

          {isCompleted ? (
            <div className="rounded-2xl border border-vaca-green/20 bg-vaca-green/5 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 text-vaca-green" />
                <div>
                  <p className="font-inter text-base font-semibold text-vaca-neutral-gray-900">
                    Private balance updated
                  </p>
                  <p className="mt-1 text-sm text-vaca-neutral-gray-600">
                    {formatStrkWei(selectedAmountWei.toString())} STRK is now available for private trading
                    in the marketplace preview.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  href="/p2p-v2"
                  variant="primary"
                  colorScheme="green"
                  size="md"
                  className="sm:flex-1"
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Continue to marketplace
                </Button>
                <Button
                  variant="outline"
                  colorScheme="neutral"
                  size="md"
                  className="sm:flex-1"
                  onClick={() => setIsCompleted(false)}
                >
                  Adjust amount
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PRESET_FUND_AMOUNTS.map(amount => {
                  const amountWei = amount * WEI;
                  const isSelected = amountWei === selectedAmountWei;

                  return (
                    <button
                      key={amount.toString()}
                      onClick={() => setSelectedAmountWei(amountWei)}
                      className={[
                        "rounded-2xl border px-4 py-5 text-left transition-colors",
                        isSelected
                          ? "border-vaca-green bg-vaca-green text-white"
                          : "border-vaca-neutral-gray-200 bg-white hover:bg-vaca-neutral-gray-50",
                      ].join(" ")}
                    >
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">Deposit</div>
                      <div className="mt-3 text-2xl font-bold">{amount.toString()} STRK</div>
                      <div className="mt-2 text-sm opacity-80">Private settlement balance</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-vaca-green/20 bg-vaca-green/5 p-4">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-5 w-5 text-vaca-green" />
                  <div>
                    <p className="font-inter text-sm font-semibold text-vaca-neutral-gray-900">
                      What this step communicates
                    </p>
                    <p className="mt-1 text-sm text-vaca-neutral-gray-600">
                      Funds move into a private balance used for trading. The user understands setup first,
                      then marketplace second.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button href="/p2p-v2" variant="ghost" colorScheme="neutral" size="md" className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  colorScheme="green"
                  size="md"
                  className="flex-1"
                  onClick={handleConfirm}
                >
                  Add {formatStrkWei(selectedAmountWei.toString())} STRK
                </Button>
              </div>
            </>
          )}
        </Card>

        <div className="space-y-6">
          <Card variant="elevated" padding="lg" className="border border-vaca-neutral-gray-100">
            <CardHeader className="mb-4">
              <div className="flex items-center gap-2">
                <CardTitle size="md">Private balance</CardTitle>
                <Wallet className="h-5 w-5 text-vaca-green" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <BalanceRow label="Available now" value={`${formatStrkWei(currentWei)} STRK`} />
              <BalanceRow label="Pending" value={`${formatStrkWei(pendingWei)} STRK`} />
              <BalanceRow label="After deposit" value={`${formatStrkWei(projectedBalance)} STRK`} strong />
            </CardContent>
          </Card>

          <Card variant="elevated" padding="lg" className="border border-vaca-neutral-gray-100">
            <CardHeader className="mb-4">
              <CardTitle size="md">Why this is separate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-vaca-neutral-gray-600">
              <p>Funding is a setup step, not a browsing step.</p>
              <p>It needs education, confirmation, and trust cues without competing against offer cards.</p>
              <p>Once funded, the marketplace can stay focused on comparing and buying offers.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BalanceRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-vaca-neutral-gray-50 px-4 py-3">
      <span className="text-sm text-vaca-neutral-gray-500">{label}</span>
      <span className={strong ? "text-sm font-semibold text-vaca-neutral-gray-900" : "text-sm text-vaca-neutral-gray-900"}>
        {value}
      </span>
    </div>
  );
}
