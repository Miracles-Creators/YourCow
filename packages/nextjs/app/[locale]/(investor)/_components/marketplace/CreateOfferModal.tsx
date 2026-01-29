"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Tag } from "lucide-react";

import { Button } from "~~/components/ui/Button";
import { Input } from "~~/components/ui/Input";
import { Card } from "~~/components/ui/Card";
import { useCreateOffer } from "~~/hooks/marketplace";
import type { PortfolioLotPositionDto } from "~~/lib/api/schemas";

export interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  lotId: number;
  lotName: string;
  position: PortfolioLotPositionDto;
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

const createIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

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
}: CreateOfferModalProps) {
  const [sharesAmount, setSharesAmount] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createOffer = useCreateOffer();

  const availableShares = parseFloat(position.available) || 0;
  const parsedShares = parseInt(sharesAmount, 10) || 0;
  const parsedPrice = parseInt(pricePerShare, 10) || 0;
  const totalValue = parsedShares * parsedPrice;
  const sellerFee = Math.floor((totalValue * 100) / 10_000);

  const isValidForm =
    parsedShares > 0 &&
    parsedShares <= availableShares &&
    parsedPrice > 0;

  const handleSubmit = useCallback(async () => {
    if (!isValidForm) return;

    setErrorMessage(null);

    try {
      await createOffer.mutateAsync({
        lotId,
        sharesAmount: parsedShares,
        pricePerShare: parsedPrice * 100, // Convert to cents
        currency: "ARS",
        idempotencyKey: createIdempotencyKey(),
      });

      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create offer"
      );
    }
  }, [
    isValidForm,
    createOffer,
    lotId,
    parsedShares,
    parsedPrice,
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

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
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
                  <div>
                    <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
                      Create Sell Offer
                    </h2>
                    <p className="text-sm text-vaca-neutral-gray-500 mt-1">
                      {lotName || "no backend"}
                    </p>
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
                  {/* Available shares info */}
                  <div className="bg-vaca-green/5 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-vaca-green/10 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-vaca-green" />
                    </div>
                    <div>
                      <p className="text-sm text-vaca-neutral-gray-600">
                        Available to sell
                      </p>
                      <p className="text-lg font-semibold text-vaca-neutral-gray-900">
                        {availableShares.toLocaleString()} shares
                      </p>
                    </div>
                  </div>

                  {/* Shares amount input */}
                  <div>
                    <Input
                      label="Number of shares to sell"
                      type="number"
                      inputSize="md"
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
                      <p className="mt-1 text-xs text-vaca-neutral-gray-500">
                        {((parsedShares / availableShares) * 100).toFixed(1)}% of
                        your position
                      </p>
                    )}
                  </div>

                  {/* Price per share input */}
                  <Input
                    label="Price per share (ARS)"
                    type="number"
                    inputSize="md"
                    fullWidth
                    value={pricePerShare}
                    onChange={(e) => setPricePerShare(e.target.value)}
                    placeholder="Enter price"
                    min={1}
                    helperText="Set your asking price per share"
                  />

                  {/* Summary */}
                  {isValidForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-vaca-neutral-gray-50 rounded-xl p-4"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-vaca-neutral-gray-600">
                          Total offer value
                        </span>
                        <span className="text-xl font-bold text-vaca-green">
                          {formatCurrency(totalValue)}
                        </span>
                      </div>
                      <p className="text-xs text-vaca-neutral-gray-500 mt-2">
                        1% fee ({formatCurrency(sellerFee)}) will be deducted upon sale
                      </p>
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

                {/* Footer */}
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
                    disabled={!isValidForm || createOffer.isPending}
                    className="flex-1"
                  >
                    {createOffer.isPending ? "Creating..." : "Create Offer"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
