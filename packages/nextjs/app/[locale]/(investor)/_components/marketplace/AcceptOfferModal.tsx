"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  ExternalLink,
  Loader2,
} from "lucide-react";

import { Button } from "~~/components/ui/Button";
import { Input } from "~~/components/ui/Input";
import { Card } from "~~/components/ui/Card";
import { Badge } from "~~/components/ui/Badge";
import { useAcceptOffer } from "~~/hooks/marketplace";
import { useTongoBalance } from "~~/hooks/tongo";
import { getTradeStatus } from "~~/lib/api/marketplace";
import type {
  OfferDto,
  PortfolioDto,
  TradeStatusResponse,
} from "~~/lib/api/schemas";
import { formatStrkWei } from "~~/utils/scaffold-stark/common";
import { formatCurrency } from "~~/lib/utils/formatCurrency";
import { createIdempotencyKey } from "~~/lib/utils/idempotency";
import { overlayVariants, modalVariants } from "../animations";

export interface AcceptOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  offer: OfferDto | null;
  portfolio?: PortfolioDto | null;
}

const FEE_BPS = 100; // 1% fee
const BPS_BASE = 10_000;

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
  const [tradeStatus, setTradeStatus] = useState<TradeStatusResponse | null>(
    null,
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const acceptOffer = useAcceptOffer();
  const { data: tongoBalance } = useTongoBalance();

  const isStrk = offer?.currency === "STRK";
  const remainingShares = offer ? offer.sharesAmount - offer.sharesFilled : 0;
  const parsedShares = parseInt(sharesAmount, 10) || 0;

  // Fiat calculations
  const subtotalCents =
    offer && !isStrk ? parsedShares * offer.pricePerShare : 0;
  const buyerFeeCents = isStrk
    ? 0
    : Math.floor((subtotalCents * FEE_BPS) / BPS_BASE);
  const totalCents = subtotalCents + buyerFeeCents;

  // STRK calculations
  const strkPricePerShare = offer?.strkPricePerShare
    ? BigInt(offer.strkPricePerShare)
    : BigInt(0);
  const strkTotal = strkPricePerShare * BigInt(parsedShares || 0);
  const strkTotalStr = strkTotal.toString();
  const tongoAvailable = tongoBalance
    ? BigInt(tongoBalance.current)
    : BigInt(0);

  // Get available fiat balance
  const currency = offer?.currency || "ARS";
  const availableFiatCents = Number(
    portfolio?.fiat?.find((balance) => balance.currency === currency)
      ?.available ?? 0,
  );

  const isValidForm = isStrk
    ? parsedShares > 0 &&
      parsedShares <= remainingShares &&
      strkTotal <= tongoAvailable
    : parsedShares > 0 &&
      parsedShares <= remainingShares &&
      totalCents <= availableFiatCents;

  const hasInsufficientFunds = isStrk
    ? parsedShares > 0 && strkTotal > tongoAvailable
    : parsedShares > 0 && totalCents > availableFiatCents;

  const startPolling = useCallback((tradeId: number) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const status = await getTradeStatus(tradeId);
        setTradeStatus(status);
        if (status.status === "COMPLETED" || status.status === "FAILED") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch {
        // keep polling on transient errors
      }
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isValidForm || !offer) return;

    setErrorMessage(null);

    try {
      const trade = await acceptOffer.mutateAsync({
        offerId: offer.id,
        input: {
          sharesAmount: parsedShares,
          idempotencyKey: createIdempotencyKey(),
        },
      });

      if (isStrk) {
        setTradeSubmitted(true);
        startPolling(trade.id);
      } else {
        onSuccess?.();
        onClose();
        resetForm();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to purchase shares",
      );
    }
  }, [
    isValidForm,
    offer,
    acceptOffer,
    parsedShares,
    isStrk,
    onSuccess,
    onClose,
    startPolling,
  ]);

  if (!offer) return null;

  const resetForm = () => {
    setSharesAmount("");
    setErrorMessage(null);
    setTradeSubmitted(false);
    setTradeStatus(null);
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
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

  const fmtCurrency = (centavos: number) => formatCurrency(centavos, currency);

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
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <Card
                  variant="elevated"
                  padding="none"
                  className="overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-vaca-neutral-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-vaca-green/10 flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4 text-vaca-green" />
                      </div>
                      <div>
                        <h2 className="font-playfair text-lg font-semibold text-vaca-neutral-gray-900">
                          Buy Shares
                        </h2>
                        <p className="text-xs text-vaca-neutral-gray-500">
                          {offer.lot?.name || `Lot #${offer.lotId}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-1.5 rounded-lg hover:bg-vaca-neutral-gray-100 transition-colors"
                      aria-label="Close modal"
                    >
                      <X className="h-4 w-4 text-vaca-neutral-gray-500" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="px-4 py-3 space-y-3">
                    {/* Offer summary */}
                    <div className="bg-vaca-neutral-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-vaca-neutral-gray-600">
                          Price per share
                        </span>
                        <span className="text-sm font-semibold text-vaca-green">
                          {isStrk && offer.strkPricePerShare
                            ? `${formatStrkWei(offer.strkPricePerShare)} STRK`
                            : fmtCurrency(offer.pricePerShare)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-vaca-neutral-gray-600">
                          Available shares
                        </span>
                        <span className="text-sm font-medium text-vaca-neutral-gray-900">
                          {remainingShares.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Your balance */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-vaca-neutral-gray-600">
                        {isStrk ? "Tongo balance" : "Your balance"}
                      </span>
                      <Badge
                        tone={hasInsufficientFunds ? "error" : "success"}
                        size="sm"
                      >
                        {isStrk
                          ? `${formatStrkWei(tongoAvailable.toString())} STRK`
                          : fmtCurrency(availableFiatCents)}
                      </Badge>
                    </div>

                    {/* Shares amount input */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-inter text-xs font-medium text-vaca-neutral-gray-700">
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
                        inputSize="sm"
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
                        className="space-y-2"
                      >
                        <div className="flex items-center gap-1.5 text-xs text-vaca-neutral-gray-600">
                          <Calculator className="h-3.5 w-3.5" />
                          <span>Price breakdown</span>
                        </div>

                        <div className="bg-vaca-neutral-gray-50 rounded-lg p-3 space-y-1.5">
                          {isStrk ? (
                            <>
                              <div className="flex justify-between text-xs">
                                <span className="text-vaca-neutral-gray-600">
                                  Total ({parsedShares} ×{" "}
                                  {offer.strkPricePerShare
                                    ? formatStrkWei(offer.strkPricePerShare)
                                    : "0"}{" "}
                                  STRK)
                                </span>
                                <span className="text-sm font-bold text-vaca-green">
                                  {formatStrkWei(strkTotalStr)} STRK
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-vaca-green">
                                <Shield className="h-3 w-3" />
                                <span>Private transfer — no fees</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between text-xs">
                                <span className="text-vaca-neutral-gray-600">
                                  Subtotal ({parsedShares} ×{" "}
                                  {fmtCurrency(offer.pricePerShare)})
                                </span>
                                <span className="text-vaca-neutral-gray-900">
                                  {fmtCurrency(subtotalCents)}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-vaca-neutral-gray-600">
                                  Fee (1%)
                                </span>
                                <span className="text-vaca-neutral-gray-900">
                                  {fmtCurrency(buyerFeeCents)}
                                </span>
                              </div>
                              <div className="border-t border-vaca-neutral-gray-200 pt-1.5 mt-1.5">
                                <div className="flex justify-between">
                                  <span className="text-xs font-semibold text-vaca-neutral-gray-900">
                                    Total
                                  </span>
                                  <span className="text-sm font-bold text-vaca-green">
                                    {fmtCurrency(totalCents)}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Insufficient funds warning */}
                        {hasInsufficientFunds && (
                          <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2">
                            <Info className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-yellow-700 font-medium">
                                Insufficient funds
                              </p>
                              <p className="text-xs text-yellow-600 mt-0.5">
                                {isStrk
                                  ? "Fund your Tongo balance to complete this purchase."
                                  : `You need ${fmtCurrency(totalCents - availableFiatCents)} more.`}
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
                        className="flex items-start gap-2 rounded-lg border border-vaca-error/20 bg-vaca-error-light px-3 py-2"
                      >
                        <AlertCircle className="h-4 w-4 text-vaca-error flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-vaca-error-dark">
                          {errorMessage}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Trade submitted — polling status + tx link */}
                  {tradeSubmitted && (
                    <div className="px-4 pb-3 space-y-3">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 ${
                          tradeStatus?.status === "FAILED"
                            ? "border-vaca-error/20 bg-vaca-error-light"
                            : tradeStatus?.status === "COMPLETED"
                              ? "border-vaca-success/20 bg-vaca-success-light"
                              : "border-vaca-blue/20 bg-vaca-blue/5"
                        }`}
                      >
                        {tradeStatus?.status === "COMPLETED" ? (
                          <CheckCircle2 className="h-4 w-4 text-vaca-success flex-shrink-0 mt-0.5" />
                        ) : tradeStatus?.status === "FAILED" ? (
                          <AlertCircle className="h-4 w-4 text-vaca-error flex-shrink-0 mt-0.5" />
                        ) : (
                          <Loader2 className="h-4 w-4 text-vaca-blue-dark flex-shrink-0 mt-0.5 animate-spin" />
                        )}
                        <div>
                          <p
                            className={`text-xs font-medium ${
                              tradeStatus?.status === "FAILED"
                                ? "text-vaca-error-dark"
                                : tradeStatus?.status === "COMPLETED"
                                  ? "text-vaca-success-dark"
                                  : "text-vaca-blue-dark"
                            }`}
                          >
                            {tradeStatus?.status === "COMPLETED"
                              ? "Trade completed"
                              : tradeStatus?.status === "TONGO_SETTLED"
                                ? "Payment confirmed — transferring shares..."
                                : tradeStatus?.status === "FAILED"
                                  ? "Trade failed"
                                  : "Processing private transfer..."}
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${
                              tradeStatus?.status === "FAILED"
                                ? "text-vaca-error"
                                : tradeStatus?.status === "COMPLETED"
                                  ? "text-vaca-success"
                                  : "text-vaca-blue-dark"
                            }`}
                          >
                            {tradeStatus?.status === "COMPLETED"
                              ? "Shares are now in your portfolio."
                              : tradeStatus?.status === "FAILED"
                                ? "Payment could not be processed. Balance not charged."
                                : "Encrypted payment settling on Starknet..."}
                          </p>
                        </div>
                      </motion.div>

                      {/* Starkscan link */}
                      {tradeStatus?.tongoTxHash && (
                        <motion.a
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          href={`https://sepolia.voyager.online/tx/${tradeStatus.tongoTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-lg border border-vaca-neutral-gray-200 bg-vaca-neutral-gray-50 px-3 py-2 text-xs font-medium text-vaca-neutral-gray-700 hover:bg-vaca-neutral-gray-100 transition-colors"
                        >
                          <Shield className="h-3.5 w-3.5 text-vaca-green" />
                          View transaction on Voyager
                          <ExternalLink className="h-3 w-3" />
                        </motion.a>
                      )}

                      <Button
                        variant="primary"
                        colorScheme="green"
                        size="sm"
                        fullWidth
                        onClick={handleClose}
                      >
                        {tradeStatus?.status === "COMPLETED" ||
                        tradeStatus?.status === "FAILED"
                          ? "Done"
                          : "Close"}
                      </Button>
                    </div>
                  )}

                  {/* Footer */}
                  {!tradeSubmitted && (
                    <div className="flex gap-2 px-4 py-3 border-t border-vaca-neutral-gray-100">
                      <Button
                        variant="ghost"
                        colorScheme="neutral"
                        size="sm"
                        onClick={handleClose}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        colorScheme="green"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!isValidForm || acceptOffer.isPending}
                        icon={<ArrowRight className="h-3.5 w-3.5" />}
                        className="flex-1"
                      >
                        {acceptOffer.isPending
                          ? "Processing..."
                          : "Confirm Purchase"}
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
