"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Tag, Shield } from "lucide-react";

import { Button } from "~~/components/ui/Button";
import { Input } from "~~/components/ui/Input";
import { Card } from "~~/components/ui/Card";
import { useCreateOffer } from "~~/hooks/marketplace";
import type { PortfolioLotPositionDto } from "~~/lib/api/schemas";
import { formatCurrency } from "~~/lib/utils/formatCurrency";
import { createIdempotencyKey } from "~~/lib/utils/idempotency";
import { overlayVariants, modalVariants } from "../animations";

type OfferCurrency = "ARS" | "STRK";

export interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  lotId: number;
  lotName: string;
  position: PortfolioLotPositionDto;
  defaultCurrency?: OfferCurrency;
}

/**
 * CreateOfferModal - Form to create a new sell offer
 * Allows users to specify shares amount and price per share
 */
export function CreateOfferModal({
  isOpen,
  onClose,
  onSuccess,
  lotId,
  lotName,
  position,
  defaultCurrency = "STRK",
}: CreateOfferModalProps) {
  const [sharesAmount, setSharesAmount] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
  const [currency, setCurrency] = useState<OfferCurrency>(defaultCurrency);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createOffer = useCreateOffer();

  const isStrk = currency === "STRK";
  const availableShares = parseFloat(position.available) || 0;
  const parsedShares = parseInt(sharesAmount, 10) || 0;
  const parsedPrice = parseFloat(pricePerShare) || 0;
  const totalValue = parsedShares * parsedPrice;
  const sellerFee = isStrk ? 0 : Math.floor((totalValue * 100) / 10_000);

  // Convert human-readable STRK to wei string
  const strkPriceWei =
    isStrk && parsedPrice > 0
      ? (BigInt(Math.floor(parsedPrice * 10000)) * BigInt(10 ** 14)).toString()
      : undefined;

  const isValidForm =
    parsedShares > 0 && parsedShares <= availableShares && parsedPrice > 0;

  const handleSubmit = useCallback(async () => {
    if (!isValidForm) return;

    setErrorMessage(null);

    try {
      await createOffer.mutateAsync({
        lotId,
        sharesAmount: parsedShares,
        pricePerShare: isStrk ? 0 : parsedPrice * 100, // cents for fiat, 0 for STRK
        strkPricePerShare: strkPriceWei,
        currency,
        idempotencyKey: createIdempotencyKey(),
      });

      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create offer",
      );
    }
  }, [
    isValidForm,
    createOffer,
    lotId,
    parsedShares,
    parsedPrice,
    isStrk,
    strkPriceWei,
    currency,
    onSuccess,
    onClose,
  ]);

  const resetForm = () => {
    setSharesAmount("");
    setPricePerShare("");
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatValue = (value: number) => {
    if (isStrk) {
      return `${value.toLocaleString(undefined, { maximumFractionDigits: 4 })} STRK`;
    }
    return formatCurrency(value * 100, "ARS");
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
                    <div>
                      <h2 className="font-playfair text-lg font-semibold text-vaca-neutral-gray-900">
                        Create Sell Offer
                      </h2>
                      <p className="text-xs text-vaca-neutral-gray-500 mt-0.5">
                        {lotName || "no backend"}
                      </p>
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
                    {/* Available shares info */}
                    <div className="bg-vaca-green/5 rounded-lg p-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-vaca-green/10 flex items-center justify-center">
                        <Tag className="h-4 w-4 text-vaca-green" />
                      </div>
                      <div>
                        <p className="text-xs text-vaca-neutral-gray-600">
                          Available to sell
                        </p>
                        <p className="text-sm font-semibold text-vaca-neutral-gray-900">
                          {availableShares.toLocaleString()} shares
                        </p>
                      </div>
                    </div>

                    {/* Shares amount input */}
                    <div>
                      <Input
                        label="Number of shares to sell"
                        type="number"
                        inputSize="sm"
                        fullWidth
                        value={sharesAmount}
                        onChange={(e) => setSharesAmount(e.target.value)}
                        placeholder="Enter amount"
                        min={1}
                        max={availableShares}
                        error={
                          parsedShares > availableShares
                            ? "Exceeds available shares"
                            : undefined
                        }
                      />
                      {parsedShares > 0 && parsedShares <= availableShares && (
                        <p className="mt-0.5 text-xs text-vaca-neutral-gray-500">
                          {((parsedShares / availableShares) * 100).toFixed(1)}%
                          of your position
                        </p>
                      )}
                    </div>

                    {/* Currency selector */}
                    <div>
                      <label className="font-inter text-xs font-medium text-vaca-neutral-gray-700 mb-1.5 block">
                        Payment currency
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrency("STRK");
                            setPricePerShare("");
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all text-xs font-medium ${
                            isStrk
                              ? "border-vaca-green bg-vaca-green/5 text-vaca-green"
                              : "border-vaca-neutral-gray-200 text-vaca-neutral-gray-500 hover:border-vaca-neutral-gray-300"
                          }`}
                        >
                          <Shield className="h-3.5 w-3.5" />
                          STRK (Private)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrency("ARS");
                            setPricePerShare("");
                          }}
                          className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all text-xs font-medium ${
                            !isStrk
                              ? "border-vaca-green bg-vaca-green/5 text-vaca-green"
                              : "border-vaca-neutral-gray-200 text-vaca-neutral-gray-500 hover:border-vaca-neutral-gray-300"
                          }`}
                        >
                          ARS (Fiat)
                        </button>
                      </div>
                    </div>

                    {/* Price per share input */}
                    <Input
                      label={
                        isStrk
                          ? "Price per share (STRK)"
                          : "Price per share (ARS)"
                      }
                      type="number"
                      inputSize="sm"
                      fullWidth
                      value={pricePerShare}
                      onChange={(e) => setPricePerShare(e.target.value)}
                      placeholder={isStrk ? "0.00" : "Enter price"}
                      min={isStrk ? 0 : 1}
                      step={isStrk ? "0.0001" : "1"}
                      helperText={
                        isStrk
                          ? "STRK per share (private)"
                          : "Set your asking price per share"
                      }
                    />

                    {/* Summary */}
                    {isValidForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-vaca-neutral-gray-50 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-vaca-neutral-gray-600">
                            Total offer value
                          </span>
                          <span className="text-lg font-bold text-vaca-green">
                            {formatValue(totalValue)}
                          </span>
                        </div>
                        {isStrk ? (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-vaca-green">
                            <Shield className="h-3 w-3" />
                            <span>Private transfer via Tongo — no fees</span>
                          </div>
                        ) : (
                          <p className="text-xs text-vaca-neutral-gray-500 mt-1">
                            1% fee ({formatValue(sellerFee)}) deducted upon sale
                          </p>
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

                  {/* Footer */}
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
                      disabled={!isValidForm || createOffer.isPending}
                      className="flex-1"
                    >
                      {createOffer.isPending ? "Creating..." : "Create Offer"}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
