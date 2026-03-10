"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Lock,
  MapPin,
  Shield,
  Wallet,
  X,
} from "lucide-react";

import { Badge } from "~~/components/ui/Badge";
import { Button } from "~~/components/ui/Button";
import { Card } from "~~/components/ui/Card";
import type { OfferDto } from "~~/lib/api/schemas";
import { cn } from "~~/lib/utils/cn";
import { useP2PPreviewStore } from "~~/services/store/p2pPreview";
import { formatStrkWei } from "~~/utils/scaffold-stark/common";

type OfferFilter = "LOWEST_PRICE" | "READY_NOW" | "PARTIALS";
type PreviewTradeStage = "review" | "encrypting" | "settling" | "completed";

interface PreviewTradeModalProps {
  balanceWei: bigint;
  isOpen: boolean;
  offer: OfferDto | null;
  onClose: () => void;
  onComplete: (result: { spentWei: bigint }) => void;
}

const WEI = 10n ** 18n;

const MOCK_OFFERS: OfferDto[] = [
  {
    id: 401,
    sellerId: 18,
    lotId: 17,
    sharesAmount: 120,
    pricePerShare: 0,
    strkPricePerShare: (3n * WEI).toString(),
    currency: "STRK",
    sharesFilled: 0,
    status: "OPEN",
    idempotencyKey: "preview-offer-401",
    createdAt: "2026-03-09T10:00:00.000Z",
    updatedAt: "2026-03-09T10:00:00.000Z",
    lot: {
      id: 17,
      name: "Lote Angus Primavera",
      pricePerShare: 0,
      status: "COMPLETED",
      productionType: "PASTURE",
      location: "Rosario, Santa Fe",
      durationWeeks: 22,
      fundingDeadline: null,
    },
  },
  {
    id: 402,
    sellerId: 27,
    lotId: 22,
    sharesAmount: 90,
    pricePerShare: 0,
    strkPricePerShare: (27n * WEI / 10n).toString(),
    currency: "STRK",
    sharesFilled: 28,
    status: "PARTIALLY_FILLED",
    idempotencyKey: "preview-offer-402",
    createdAt: "2026-03-08T16:30:00.000Z",
    updatedAt: "2026-03-08T19:10:00.000Z",
    lot: {
      id: 22,
      name: "Lote Hereford Norte",
      pricePerShare: 0,
      status: "COMPLETED",
      productionType: "FEEDLOT",
      location: "Cordoba, Argentina",
      durationWeeks: 18,
      fundingDeadline: null,
    },
  },
  {
    id: 403,
    sellerId: 31,
    lotId: 24,
    sharesAmount: 60,
    pricePerShare: 0,
    strkPricePerShare: (32n * WEI / 10n).toString(),
    currency: "STRK",
    sharesFilled: 12,
    status: "PARTIALLY_FILLED",
    idempotencyKey: "preview-offer-403",
    createdAt: "2026-03-09T08:20:00.000Z",
    updatedAt: "2026-03-09T08:20:00.000Z",
    lot: {
      id: 24,
      name: "Lote Brangus Delta",
      pricePerShare: 0,
      status: "COMPLETED",
      productionType: "MIXED",
      location: "Entre Rios, Argentina",
      durationWeeks: 20,
      fundingDeadline: null,
    },
  },
];

export function P2PMarketplaceV2Screen() {
  const [selectedFilter, setSelectedFilter] = useState<OfferFilter>("LOWEST_PRICE");
  const [selectedOffer, setSelectedOffer] = useState<OfferDto | null>(null);

  const currentWei = useP2PPreviewStore(state => state.currentWei);
  const pendingWei = useP2PPreviewStore(state => state.pendingWei);
  const spendBalance = useP2PPreviewStore(state => state.spendBalance);

  const balanceWei = BigInt(currentWei);
  const hasBalance = balanceWei > 0n;

  const filteredOffers = [...MOCK_OFFERS]
    .filter(offer => {
      if (selectedFilter === "READY_NOW") return offer.status === "OPEN";
      if (selectedFilter === "PARTIALS") return offer.status === "PARTIALLY_FILLED";
      return true;
    })
    .sort((a, b) => {
      if (selectedFilter === "PARTIALS") return b.sharesFilled - a.sharesFilled;
      return Number(BigInt(a.strkPricePerShare ?? "0") - BigInt(b.strkPricePerShare ?? "0"));
    });

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="pt-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-inter text-[11px] font-bold uppercase tracking-[0.18em] text-vaca-neutral-gray-400">
              P2P Preview
            </p>
            <h1 className="mt-2 font-playfair text-3xl font-bold tracking-tight text-vaca-neutral-gray-900">
              Private Market
            </h1>
          </div>
          <Badge tone="info" size="md">
            Client-only
          </Badge>
        </div>
      </motion.div>

      <div className="mt-6 space-y-4">
        <MarketToolbar currentWei={currentWei} pendingWei={pendingWei} offersCount={filteredOffers.length} />

        {!hasBalance ? (
          <MarketplaceSetupCard />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "LOWEST_PRICE" as const, label: "Lowest price" },
                { key: "READY_NOW" as const, label: "Ready now" },
                { key: "PARTIALS" as const, label: "Partials" },
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key)}
                  className={cn(
                    "rounded-full px-4 py-2 font-inter text-sm font-medium transition-all",
                    selectedFilter === filter.key
                      ? "bg-vaca-neutral-gray-900 text-white shadow-sm"
                      : "border border-vaca-neutral-gray-200 bg-white text-vaca-neutral-gray-600 hover:bg-vaca-neutral-gray-50",
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredOffers.map(offer => (
                <MarketOfferRow key={offer.id} offer={offer} onBuy={() => setSelectedOffer(offer)} />
              ))}
            </div>
          </>
        )}
      </div>

      <PreviewTradeModal
        balanceWei={balanceWei}
        isOpen={Boolean(selectedOffer)}
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onComplete={({ spentWei }) => {
          spendBalance(spentWei.toString());
          setSelectedOffer(null);
        }}
      />
    </div>
  );
}

function MarketToolbar({
  currentWei,
  pendingWei,
  offersCount,
}: {
  currentWei: string;
  pendingWei: string;
  offersCount: number;
}) {
  return (
    <Card variant="elevated" padding="none" className="overflow-hidden border border-vaca-neutral-gray-100">
      <div className="grid grid-cols-1 divide-y divide-vaca-neutral-gray-100 md:grid-cols-[1.05fr_0.95fr] md:divide-x md:divide-y-0">
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success" size="md" icon={<Shield className="h-3.5 w-3.5" />}>
              Private balance
            </Badge>
            <Badge tone="neutral" size="md">
              {offersCount} offers
            </Badge>
          </div>
          <div className="mt-4 flex items-end gap-3">
            <p className="font-inter text-3xl font-bold tracking-tight text-vaca-neutral-gray-900">
              {formatStrkWei(currentWei)} STRK
            </p>
            <span className="pb-1 text-sm text-vaca-neutral-gray-400">
              pending {formatStrkWei(pendingWei)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 p-5">
          <div>
            <p className="font-inter text-sm font-semibold text-vaca-neutral-gray-900">
              Deposit outside the market
            </p>
            <p className="mt-1 text-sm text-vaca-neutral-gray-500">
              Setup first, then trade.
            </p>
          </div>
          <Button
            href="/p2p-v2/fund"
            variant="primary"
            colorScheme="green"
            size="md"
            icon={<Wallet className="h-4 w-4" />}
            iconPosition="left"
          >
            Deposit
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MarketplaceSetupCard() {
  return (
    <Card variant="elevated" padding="lg" className="border border-vaca-neutral-gray-100">
      <div className="flex flex-col items-start gap-4">
        <Badge tone="warning" size="md">
          No balance
        </Badge>
        <div>
          <p className="font-playfair text-2xl font-semibold text-vaca-neutral-gray-900">
            Deposit before trading
          </p>
          <p className="mt-2 max-w-xl text-sm text-vaca-neutral-gray-500">
            The market stops here until the user has private funds available.
          </p>
        </div>
        <Button
          href="/p2p-v2/fund"
          variant="primary"
          colorScheme="green"
          size="md"
          icon={<ArrowRight className="h-4 w-4" />}
        >
          Go to funding flow
        </Button>
      </div>
    </Card>
  );
}

function MarketOfferRow({
  offer,
  onBuy,
}: {
  offer: OfferDto;
  onBuy: () => void;
}) {
  const remainingShares = offer.sharesAmount - offer.sharesFilled;
  const totalWei = BigInt(offer.strkPricePerShare ?? "0") * BigInt(remainingShares);

  return (
    <Card variant="elevated" padding="none" className="overflow-hidden border border-vaca-neutral-gray-100">
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
              {offer.lot?.name ?? `Lot #${offer.lotId}`}
            </h3>
            <Badge tone={offer.status === "OPEN" ? "success" : "info"} size="sm">
              {offer.status === "OPEN" ? "Open" : "Partial"}
            </Badge>
            <Badge tone="neutral" size="sm" icon={<Lock className="h-3 w-3" />}>
              Private settlement
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-vaca-neutral-gray-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {offer.lot?.location ?? "Unknown"}
            </span>
            <span>{remainingShares} shares</span>
            <span>{offer.lot?.durationWeeks ?? "—"} weeks</span>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-3 lg:min-w-[320px]">
          <MetricCell label="Price / share" value={`${formatStrkWei(offer.strkPricePerShare ?? "0")} STRK`} />
          <MetricCell label="Total available" value={`${formatStrkWei(totalWei.toString())} STRK`} />
        </div>

        <div className="flex items-center justify-end lg:min-w-[108px]">
          <Button variant="primary" colorScheme="green" size="md" onClick={onBuy} icon={<ChevronRight className="h-4 w-4" />}>
            Buy
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-vaca-neutral-gray-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-vaca-neutral-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-vaca-neutral-gray-900">{value}</p>
    </div>
  );
}

function PreviewTradeModal({
  balanceWei,
  isOpen,
  offer,
  onClose,
  onComplete,
}: PreviewTradeModalProps) {
  const [sharesAmount, setSharesAmount] = useState(20);
  const [stage, setStage] = useState<PreviewTradeStage>("review");
  const [settlementDone, setSettlementDone] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSharesAmount(20);
      setStage("review");
      setSettlementDone(false);
    }
  }, [isOpen]);

  if (!offer) return null;

  const remainingShares = offer.sharesAmount - offer.sharesFilled;
  const safeSharesAmount = Math.min(sharesAmount, remainingShares);
  const priceWei = BigInt(offer.strkPricePerShare ?? "0");
  const totalWei = priceWei * BigInt(safeSharesAmount);
  const canAfford = totalWei <= balanceWei;

  const runPreviewSettlement = () => {
    setStage("encrypting");

    window.setTimeout(() => setStage("settling"), 1200);
    window.setTimeout(() => {
      setStage("completed");
      setSettlementDone(true);
    }, 2800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="w-full max-w-xl"
              onClick={event => event.stopPropagation()}
            >
              <Card variant="elevated" padding="none" className="overflow-hidden">
                <div className="flex items-start justify-between border-b border-vaca-neutral-gray-100 p-6">
                  <div>
                    <Badge tone="success" size="md" icon={<Shield className="h-3.5 w-3.5" />}>
                      Private settlement
                    </Badge>
                    <h2 className="mt-3 font-playfair text-2xl font-semibold text-vaca-neutral-gray-900">
                      {offer.lot?.name ?? `Lot #${offer.lotId}`}
                    </h2>
                  </div>

                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 transition-colors hover:bg-vaca-neutral-gray-100"
                    aria-label="Close trade preview"
                  >
                    <X className="h-5 w-5 text-vaca-neutral-gray-500" />
                  </button>
                </div>

                <div className="space-y-5 p-6">
                  <div className="rounded-2xl bg-vaca-neutral-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-vaca-neutral-gray-600">Price per share</span>
                      <span className="text-lg font-semibold text-vaca-green">
                        {formatStrkWei(priceWei.toString())} STRK
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-vaca-neutral-gray-600">Available shares</span>
                      <span className="font-medium text-vaca-neutral-gray-900">{remainingShares}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-vaca-green/20 bg-vaca-green/5 p-4">
                    <p className="font-inter text-sm font-semibold text-vaca-neutral-gray-900">
                      Visible trade, hidden amount
                    </p>
                    <p className="mt-1 text-sm text-vaca-neutral-gray-600">
                      The trade completes publicly, but the STRK amount is hidden from external observers.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[10, 20, Math.min(40, remainingShares)].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setSharesAmount(amount)}
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors",
                          amount === safeSharesAmount
                            ? "border-vaca-green bg-vaca-green text-white"
                            : "border-vaca-neutral-gray-200 bg-white text-vaca-neutral-gray-700 hover:bg-vaca-neutral-gray-50",
                        )}
                      >
                        {amount} shares
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-vaca-neutral-gray-100 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-vaca-neutral-gray-600">Private balance</span>
                      <Badge tone={canAfford ? "success" : "error"} size="md">
                        {formatStrkWei(balanceWei.toString())} STRK
                      </Badge>
                    </div>
                    <div className="mt-4 border-t border-vaca-neutral-gray-100 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-vaca-neutral-gray-600">
                          Total ({safeSharesAmount} x {formatStrkWei(priceWei.toString())} STRK)
                        </span>
                        <span className="text-xl font-bold text-vaca-green">
                          {formatStrkWei(totalWei.toString())} STRK
                        </span>
                      </div>
                    </div>
                  </div>

                  {stage !== "review" && (
                    <div className="rounded-2xl border border-vaca-neutral-gray-100 bg-vaca-neutral-gray-50 p-4">
                      <SettlementRow label="Encrypting payment" active={stage === "encrypting"} complete />
                      <SettlementRow
                        label="Payment settled privately"
                        active={stage === "settling"}
                        complete={stage === "settling" || stage === "completed"}
                      />
                      <SettlementRow
                        label="Shares transferred"
                        active={stage === "completed"}
                        complete={stage === "completed"}
                        last
                      />
                    </div>
                  )}

                  {!canAfford && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      Fund the private balance first to continue with the trade.
                    </div>
                  )}
                </div>

                <div className="flex gap-3 border-t border-vaca-neutral-gray-100 p-6">
                  <Button variant="ghost" colorScheme="neutral" size="md" onClick={onClose} className="flex-1">
                    Close
                  </Button>

                  {!settlementDone ? (
                    <Button
                      variant="primary"
                      colorScheme="green"
                      size="md"
                      onClick={runPreviewSettlement}
                      disabled={!canAfford}
                      className="flex-1"
                    >
                      Preview trade
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      colorScheme="green"
                      size="md"
                      onClick={() => onComplete({ spentWei: totalWei })}
                      className="flex-1"
                    >
                      Apply preview result
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function SettlementRow({
  label,
  active,
  complete,
  last = false,
}: {
  label: string;
  active: boolean;
  complete: boolean;
  last?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3 py-3", !last && "border-b border-vaca-neutral-gray-100")}>
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full",
          complete ? "bg-vaca-green text-white" : "bg-vaca-neutral-gray-200 text-vaca-neutral-gray-500",
        )}
      >
        {active ? <Clock3 className="h-4 w-4" /> : complete ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-vaca-neutral-gray-900">{label}</span>
        {active && <span className="text-xs text-vaca-neutral-gray-500">in progress</span>}
      </div>
    </div>
  );
}
