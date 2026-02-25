"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertCircle,
  ShoppingCart,
  ArrowRight,
  Info,
  Calculator,
  Shield,
  CheckCircle2,
} from "lucide-react";

import { Button } from "~~/components/ui/Button";
import { Input } from "~~/components/ui/Input";
import { Card } from "~~/components/ui/Card";
import { Badge } from "~~/components/ui/Badge";
import { useAcceptOffer } from "~~/hooks/marketplace";
import { useTongoBalance } from "~~/hooks/tongo";
import type { OfferDto, PortfolioDto } from "~~/lib/api/schemas";

function formatStrk(wei: string): string {
  const value = BigInt(wei);
  const whole = value / BigInt(10 ** 18);
  const fraction = value % BigInt(10 ** 18);
  const fractionStr = fraction.toString().padStart(18, "0").slice(0, 4);
  return `${whole.toLocaleString()}.${fractionStr}`;
}

export interface AcceptOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  offer: OfferDto | null;
  portfolio?: PortfolioDto | null;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

const FEE_BPS = 100; // 1% fee
const BPS_BASE = 10_000;
const createIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

/**
 * AcceptOfferModal - Confirmation dialog for buying shares
 * Shows offer details, calculates fees, and confirms the purchase
 */
export function AcceptOfferModal({
  isOpen,
  onClose,
  onSuccess,
  offer,
  portfolio,
}: AcceptOfferModalProps) {
  const [sharesAmount, setSharesAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tradeSubmitted, setTradeSubmitted] = useState(false);

  const acceptOffer = useAcceptOffer();
  const { data: tongoBalance } = useTongoBalance();

  const isStrk = offer?.currency === "STRK";
  const remainingShares = offer ? offer.sharesAmount - offer.sharesFilled : 0;
  const parsedShares = parseInt(sharesAmount, 10) || 0;

  // Fiat calculations
  const subtotalCents = offer && !isStrk ? parsedShares * offer.pricePerShare : 0;
  const buyerFeeCents = isStrk ? 0 : Math.floor((subtotalCents * FEE_BPS) / BPS_BASE);
  const totalCents = subtotalCents + buyerFeeCents;

  // STRK calculations
  const strkPricePerShare = offer?.strkPricePerShare ? BigInt(offer.strkPricePerShare) : BigInt(0);
  const strkTotal = strkPricePerShare * BigInt(parsedShares || 0);
  const strkTotalStr = strkTotal.toString();
  const tongoAvailable = tongoBalance ? BigInt(tongoBalance.current) : BigInt(0);

  // Get available fiat balance
  const currency = offer?.currency || "ARS";
  const availableFiatCents = Number(
    portfolio?.fiat?.find((balance) => balance.currency === currency)?.available ?? 0,
  );

  const isValidForm = isStrk
    ? parsedShares > 0 && parsedShares <= remainingShares && strkTotal <= tongoAvailable
    : parsedShares > 0 && parsedShares <= remainingShares && totalCents <= availableFiatCents;

  const hasInsufficientFunds = isStrk
    ? parsedShares > 0 && strkTotal > tongoAvailable
    : parsedShares > 0 && totalCents > availableFiatCents;

  const handleSubmit = useCallback(async () => {
    if (!isValidForm || !offer) return;

    setErrorMessage(null);

    try {
      await acceptOffer.mutateAsync({
        offerId: offer.id,
        input: {
          sharesAmount: parsedShares,
          idempotencyKey: createIdempotencyKey(),
        },
      });

      if (isStrk) {
        setTradeSubmitted(true);
      } else {
        onSuccess?.();
        onClose();
        resetForm();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to purchase shares"
      );
    }
  }, [isValidForm, offer, acceptOffer, parsedShares, isStrk, onSuccess, onClose]);

  if (!offer) return null;

  const resetForm = () => {
    setSharesAmount("");
    setErrorMessage(null);
    setTradeSubmitted(false);
  };

  const handleClose = () => {
    if (tradeSubmitted) {
      onSuccess?.();
    }
    resetForm();
    onClose();
  };

  const handleBuyAll = () => {
    setSharesAmount(String(remainingShares));
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
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
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-vaca-neutral-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-vaca-green/10 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-vaca-green" />
                    </div>
                    <div>
                      <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
                        Buy Shares
                      </h2>
                      <p className="text-sm text-vaca-neutral-gray-500">
                        {offer.lot?.name || `Lot #${offer.lotId}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg hover:bg-vaca-neutral-gray-100 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5 text-vaca-neutral-gray-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                  {/* Offer summary */}
                  <div className="bg-vaca-neutral-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-vaca-neutral-gray-600">
                        Price per share
                      </span>
                      <span className="text-lg font-semibold text-vaca-green">
                        {isStrk && offer.strkPricePerShare
                          ? `${formatStrk(offer.strkPricePerShare)} STRK`
                          : formatCurrency(offer.pricePerShare / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-vaca-neutral-gray-600">
                        Available shares
                      </span>
                      <span className="font-medium text-vaca-neutral-gray-900">
                        {remainingShares.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Your balance */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-vaca-neutral-gray-600">
                      {isStrk ? "Tongo balance" : "Your balance"}
                    </span>
                    <Badge tone={hasInsufficientFunds ? "error" : "success"} size="md">
                      {isStrk
                        ? `${formatStrk(tongoAvailable.toString())} STRK`
                        : formatCurrency(availableFiatCents / 100)}
                    </Badge>
                  </div>

                  {/* Shares amount input */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-inter text-sm font-medium text-vaca-neutral-gray-700">
                        Shares to buy
                      </label>
                      <button
                        type="button"
                        onClick={handleBuyAll}
                        className="text-xs font-medium text-vaca-blue hover:underline"
                      >
                        Buy all ({remainingShares})
                      </button>
                    </div>
                    <Input
                      type="number"
                      inputSize="md"
                      fullWidth
                      value={sharesAmount}
                      onChange={(e) => setSharesAmount(e.target.value)}
                      placeholder="Enter amount"
                      min={1}
                      max={remainingShares}
                      error={
                        parsedShares > remainingShares
                          ? "Exceeds available shares"
                          : undefined
                      }
                    />
                  </div>

                  {/* Price breakdown */}
                  {parsedShares > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 text-sm text-vaca-neutral-gray-600">
                        <Calculator className="h-4 w-4" />
                        <span>Price breakdown</span>
                      </div>

                      <div className="bg-vaca-neutral-gray-50 rounded-xl p-4 space-y-2">
                        {isStrk ? (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-vaca-neutral-gray-600">
                                Total ({parsedShares} × {offer.strkPricePerShare ? formatStrk(offer.strkPricePerShare) : "0"} STRK)
                              </span>
                              <span className="text-lg font-bold text-vaca-green">
                                {formatStrk(strkTotalStr)} STRK
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-vaca-green pt-1">
                              <Shield className="h-3.5 w-3.5" />
                              <span>Private transfer — no fees</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-vaca-neutral-gray-600">
                                Subtotal ({parsedShares} × {formatCurrency(offer.pricePerShare / 100)})
                              </span>
                              <span className="text-vaca-neutral-gray-900">
                                {formatCurrency(subtotalCents / 100)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-vaca-neutral-gray-600">
                                Fee (1%)
                              </span>
                              <span className="text-vaca-neutral-gray-900">
                                {formatCurrency(buyerFeeCents / 100)}
                              </span>
                            </div>
                            <div className="border-t border-vaca-neutral-gray-200 pt-2 mt-2">
                              <div className="flex justify-between">
                                <span className="font-semibold text-vaca-neutral-gray-900">
                                  Total
                                </span>
                                <span className="text-lg font-bold text-vaca-green">
                                  {formatCurrency(totalCents / 100)}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Insufficient funds warning */}
                      {hasInsufficientFunds && (
                        <div className="flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                          <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-yellow-700 font-medium">
                              Insufficient funds
                            </p>
                            <p className="text-xs text-yellow-600 mt-1">
                              {isStrk
                                ? "Fund your Tongo balance to complete this purchase."
                                : `You need ${formatCurrency((totalCents - availableFiatCents) / 100)} more to complete this purchase.`}
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Error message */}
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                    >
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </motion.div>
                  )}
                </div>

                {/* Trade submitted success for STRK */}
                {tradeSubmitted && (
                  <div className="p-6 pt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 mb-4"
                    >
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-green-700 font-medium">
                          Trade submitted
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Your private transfer is being processed. Shares will appear in your portfolio once confirmed.
                        </p>
                      </div>
                    </motion.div>
                    <Button
                      variant="primary"
                      colorScheme="green"
                      size="md"
                      fullWidth
                      onClick={handleClose}
                    >
                      Done
                    </Button>
                  </div>
                )}

                {/* Footer */}
                {!tradeSubmitted && (
                  <div className="flex gap-3 p-6 pt-0">
                    <Button
                      variant="ghost"
                      colorScheme="neutral"
                      size="md"
                      onClick={handleClose}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      colorScheme="green"
                      size="md"
                      onClick={handleSubmit}
                      disabled={!isValidForm || acceptOffer.isPending}
                      icon={<ArrowRight className="h-4 w-4" />}
                      className="flex-1"
                    >
                      {acceptOffer.isPending ? "Processing..." : "Confirm Purchase"}
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
