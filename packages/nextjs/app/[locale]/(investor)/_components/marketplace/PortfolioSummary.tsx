"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  Lock,
  Tag,
  ArrowUpRight,
  AlertCircle,
  X,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "~~/components/ui/Card";
import { Badge } from "~~/components/ui/Badge";
import { Button } from "~~/components/ui/Button";
import { Input } from "~~/components/ui/Input";
import { ProgressBar } from "~~/components/ui/ProgressBar";
import { cn } from "~~/lib/utils/cn";
import type { PortfolioDto } from "~~/lib/api/schemas";
import { useMe } from "~~/hooks/auth/useMe";
import { useCreatePayment } from "~~/hooks/payments/useCreatePayment";
import { useConfirmPayment } from "~~/hooks/payments/useConfirmPayment";
import { useFiatDeposit } from "~~/hooks/payments/useFiatDeposit";

export interface PortfolioSummaryProps {
  portfolio: PortfolioDto | null | undefined;
  isLoading?: boolean;
  error?: Error | null;
  onCreateOffer?: (lotId: number) => void;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.15 } },
};

/**
 * PortfolioSummary - Overview of user's marketplace portfolio
 * Shows fiat balances and lot positions with actions
 */
export function PortfolioSummary({
  portfolio,
  isLoading = false,
  error,
  onCreateOffer,
  className,
}: PortfolioSummaryProps) {
  const fallbackText = "no backend";
  const { data: me } = useMe();
  const createPayment = useCreatePayment();
  const confirmPayment = useConfirmPayment();
  const fiatDeposit = useFiatDeposit();

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositCurrency, setDepositCurrency] = useState<"ARS" | "USD">("ARS");
  const [depositLotId, setDepositLotId] = useState("");
  const [depositError, setDepositError] = useState<string | null>(null);

  // Format currency
  const formatCurrency = (value: string | number, currency: string = "ARS") => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue / 100); // Convert from cents
  };

  const parsedDepositAmount = Number(depositAmount.replace(",", "."));
  const isValidDepositAmount = Number.isFinite(parsedDepositAmount) && parsedDepositAmount > 0;
  const depositAmountCents = isValidDepositAmount ? Math.round(parsedDepositAmount * 100) : 0;
  const parsedLotId = Number(depositLotId);
  const isValidLotId = Number.isInteger(parsedLotId) && parsedLotId > 0;
  const isDepositing = createPayment.isPending || confirmPayment.isPending || fiatDeposit.isPending;

  const handleDeposit = async () => {
    setDepositError(null);

    if (!me?.id) {
      setDepositError("No authenticated user");
      return;
    }

    if (!isValidLotId) {
      setDepositError("Enter a valid lot ID");
      return;
    }

    if (!isValidDepositAmount) {
      setDepositError("Enter a valid amount");
      return;
    }

    try {
      const payment = await createPayment.mutateAsync({
        paymentIntentId: `manual_${Date.now()}`,
        investorId: me.id,
        lotId: parsedLotId,
        amountFiat: depositAmountCents,
        currency: depositCurrency,
      });

      await confirmPayment.mutateAsync({ id: payment.id });
      await fiatDeposit.mutateAsync({ id: payment.id });
      setDepositAmount("");
      setDepositLotId("");
      setIsDepositOpen(false);
    } catch (err) {
      setDepositError(err instanceof Error ? err.message : "Deposit failed");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <LoadingSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex flex-col items-center justify-center py-12 px-4 text-center bg-vaca-error-light rounded-xl border border-vaca-error/10",
          className
        )}
      >
        <AlertCircle className="h-10 w-10 text-vaca-error mb-4" />
        <h3 className="font-playfair text-lg font-semibold text-vaca-neutral-gray-900 mb-2">
          Failed to load portfolio
        </h3>
        <p className="text-sm text-vaca-neutral-gray-500">
          {error.message || "Please try again later"}
        </p>
      </motion.div>
    );
  }

  // Empty portfolio state
  if (!portfolio) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex flex-col items-center justify-center py-12 px-4 text-center bg-vaca-neutral-gray-50 rounded-xl",
          className
        )}
      >
        <Wallet className="h-12 w-12 text-vaca-neutral-gray-400 mb-4" />
        <h3 className="font-playfair text-lg font-semibold text-vaca-neutral-gray-900 mb-2">
          No portfolio data
        </h3>
        <p className="text-sm text-vaca-neutral-gray-500">
          Start investing to see your portfolio here
        </p>
      </motion.div>
    );
  }

  const findBalance = (currency: string) =>
    portfolio.fiat.find((balance) => balance.currency === currency);

  const arsBalance = findBalance("ARS");
  const usdBalance = findBalance("USD");

  const arsAvailable = parseFloat(arsBalance?.available ?? "0");
  const arsLocked = parseFloat(arsBalance?.locked ?? "0");
  const usdAvailable = parseFloat(usdBalance?.available ?? "0");
  const usdLocked = parseFloat(usdBalance?.locked ?? "0");
  const hasArs = Boolean(arsBalance);
  const hasUsd = Boolean(usdBalance);

  const hasPositions = portfolio.lots.length > 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-6", className)}
    >
      {/* Fiat Balances Section */}
      <motion.div variants={itemVariants}>
        <Card variant="elevated" accent="blue" padding="lg">
          <CardHeader className="mb-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CardTitle size="md">Cash Balance</CardTitle>
                <Wallet className="h-5 w-5 text-vaca-blue" />
              </div>
              <Button
                variant="outline"
                size="sm"
                colorScheme="blue"
                onClick={() => setIsDepositOpen(true)}
              >
                Deposit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {/* ARS Balance */}
              <div className="bg-vaca-neutral-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-vaca-neutral-gray-500">
                    Argentine Pesos
                  </span>
                  <Badge tone="info" size="sm">ARS</Badge>
                </div>
                <p className="text-2xl font-bold text-vaca-neutral-gray-900">
                  {hasArs ? formatCurrency(arsAvailable, "ARS") : fallbackText}
                </p>
                {hasArs && arsLocked > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-vaca-neutral-gray-500">
                    <Lock className="h-3 w-3" />
                    <span>{formatCurrency(arsLocked, "ARS")} locked</span>
                  </div>
                )}
              </div>

              {/* USD Balance */}
              <div className="bg-vaca-neutral-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-vaca-neutral-gray-500">
                    US Dollars
                  </span>
                  <Badge tone="success" size="sm">USD</Badge>
                </div>
                <p className="text-2xl font-bold text-vaca-neutral-gray-900">
                  {hasUsd ? formatCurrency(usdAvailable, "USD") : fallbackText}
                </p>
                {hasUsd && usdLocked > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-vaca-neutral-gray-500">
                    <Lock className="h-3 w-3" />
                    <span>{formatCurrency(usdLocked, "USD")} locked</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {isDepositOpen && (
          <>
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsDepositOpen(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <Card variant="elevated" padding="none" className="overflow-hidden">
                  <div className="flex items-center justify-between p-6 border-b border-vaca-neutral-gray-100">
                    <div>
                      <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
                        Deposit funds
                      </h2>
                      <p className="text-sm text-vaca-neutral-gray-500 mt-1">
                        This creates a payment, confirms it, and deposits fiat into your balance.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsDepositOpen(false)}
                      className="p-2 rounded-lg hover:bg-vaca-neutral-gray-100 transition-colors"
                      aria-label="Close modal"
                    >
                      <X className="h-5 w-5 text-vaca-neutral-gray-500" />
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDepositCurrency("ARS")}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                          depositCurrency === "ARS"
                            ? "border-vaca-blue bg-vaca-blue/10 text-vaca-blue"
                            : "border-vaca-neutral-gray-200 text-vaca-neutral-gray-600 hover:bg-vaca-neutral-gray-50",
                        )}
                      >
                        ARS
                      </button>
                      <button
                        type="button"
                        onClick={() => setDepositCurrency("USD")}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                          depositCurrency === "USD"
                            ? "border-vaca-blue bg-vaca-blue/10 text-vaca-blue"
                            : "border-vaca-neutral-gray-200 text-vaca-neutral-gray-600 hover:bg-vaca-neutral-gray-50",
                        )}
                      >
                        USD
                      </button>
                    </div>

                    <Input
                      label="Lot ID"
                      type="number"
                      inputSize="md"
                      fullWidth
                      value={depositLotId}
                      onChange={(e) => setDepositLotId(e.target.value)}
                      placeholder="e.g. 12"
                      min={1}
                    />

                    <Input
                      label={`Amount (${depositCurrency})`}
                      type="number"
                      inputSize="md"
                      fullWidth
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      min={0}
                    />

                    {depositError && (
                      <div className="rounded-lg border border-vaca-error/20 bg-vaca-error-light px-3 py-2 text-sm text-vaca-error-dark">
                        {depositError}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        colorScheme="neutral"
                        fullWidth
                        onClick={() => setIsDepositOpen(false)}
                        disabled={isDepositing}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        fullWidth
                        onClick={handleDeposit}
                        disabled={!isValidDepositAmount || !isValidLotId || isDepositing}
                      >
                        {isDepositing ? "Depositing..." : "Deposit"}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Lot Positions Section */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
            Your Positions
          </h2>
          {hasPositions && (
            <Badge tone="neutral" size="md">
              {portfolio.lots.length} lot{portfolio.lots.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {hasPositions ? (
          <div className="space-y-4">
            {portfolio.lots.map((position) => {
              const available = parseFloat(position.available);
              const locked = parseFloat(position.locked);
              const total = parseFloat(position.total);
              const lockedPercentage = total > 0 ? (locked / total) * 100 : 0;
              const valuationText =
                position.valuation != null
                  ? formatCurrency(position.valuation, "ARS")
                  : fallbackText;
              const lastPriceText =
                position.lastPricePerShare != null
                  ? formatCurrency(position.lastPricePerShare, "ARS")
                  : fallbackText;

              return (
                <motion.div key={position.lotId} variants={itemVariants}>
                  <Card variant="bordered" padding="md" className="hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Lot info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="h-4 w-4 text-vaca-green" />
                          <h3 className="font-semibold text-vaca-neutral-gray-900">
                            {position.lotName || `Lot #${position.lotId}`}
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-vaca-neutral-gray-500">Available</span>
                            <p className="font-semibold text-vaca-green">
                              {available.toLocaleString()} shares
                            </p>
                          </div>
                          <div>
                            <span className="text-vaca-neutral-gray-500">Locked</span>
                            <p className="font-semibold text-vaca-neutral-gray-700">
                              {locked.toLocaleString()} shares
                            </p>
                          </div>
                        </div>

                        {/* Locked percentage bar */}
                        {locked > 0 && (
                          <div className="mt-3">
                            <ProgressBar
                              value={lockedPercentage}
                              size="xs"
                              color="blue"
                              label={`${lockedPercentage.toFixed(1)}% in active offers`}
                            />
                          </div>
                        )}

                        <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-vaca-neutral-gray-500">
                          <div>
                            <span className="block">Last price</span>
                            <span className="font-medium text-vaca-neutral-gray-700">
                              {lastPriceText}
                            </span>
                          </div>
                          <div>
                            <span className="block">Valuation</span>
                            <span className="font-medium text-vaca-neutral-gray-700">
                              {valuationText}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        {available > 0 && onCreateOffer && (
                          <Button
                            variant="primary"
                            colorScheme="green"
                            size="sm"
                            onClick={() => onCreateOffer(position.lotId)}
                            icon={<ArrowUpRight className="h-4 w-4" />}
                          >
                            Sell
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          colorScheme="neutral"
                          size="sm"
                          href={`/lot/${position.lotId}`}
                        >
                          View Lot
                        </Button>
                      </div>
                    </div>

                    {locked > 0 && (
                      <div className="mt-3 pt-3 border-t border-vaca-neutral-gray-100">
                        <span className="text-xs text-vaca-neutral-gray-500">
                          Active offers: {fallbackText}
                        </span>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card variant="bordered" padding="lg" className="text-center">
            <TrendingUp className="h-10 w-10 text-vaca-neutral-gray-400 mx-auto mb-3" />
            <p className="text-vaca-neutral-gray-600 mb-4">
              You don&apos;t have any lot positions yet
            </p>
            <Button
              variant="primary"
              colorScheme="green"
              size="md"
              href="/marketplace"
            >
              Browse Marketplace
            </Button>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}

/**
 * Loading skeleton for portfolio summary
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Fiat balance skeleton */}
      <div className="bg-vaca-neutral-white rounded-xl shadow-md border-l-4 border-l-vaca-blue p-6">
        <div className="h-6 bg-vaca-neutral-gray-200 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-vaca-neutral-gray-50 rounded-xl p-4">
            <div className="h-4 bg-vaca-neutral-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-vaca-neutral-gray-200 rounded w-3/4" />
          </div>
          <div className="bg-vaca-neutral-gray-50 rounded-xl p-4">
            <div className="h-4 bg-vaca-neutral-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-vaca-neutral-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>

      {/* Positions skeleton */}
      <div>
        <div className="h-6 bg-vaca-neutral-gray-200 rounded w-1/4 mb-4" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-vaca-neutral-white rounded-xl border border-vaca-neutral-gray-200 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-4 bg-vaca-neutral-gray-200 rounded" />
                <div className="h-5 bg-vaca-neutral-gray-200 rounded w-1/3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-12 bg-vaca-neutral-gray-100 rounded" />
                <div className="h-12 bg-vaca-neutral-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
