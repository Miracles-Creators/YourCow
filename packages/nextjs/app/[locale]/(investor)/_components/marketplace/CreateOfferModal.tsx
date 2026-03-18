"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Tag, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

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

export function CreateOfferModal({
  isOpen,
  onClose,
  onSuccess,
  lotId,
  lotName,
  position,
  defaultCurrency = "STRK",
}: CreateOfferModalProps) {
  const t = useTranslations("investor.trade");
  const tc = useTranslations("investor.trade.createOffer");

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
        pricePerShare: isStrk ? 0 : parsedPrice * 100,
        strkPricePerShare: strkPriceWei,
        currency,
        idempotencyKey: createIdempotencyKey(),
      });

      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : tc("createFailed"),
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
    tc,
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
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

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
                        {tc("title")}
                      </h2>
                      <p className="text-xs text-vaca-neutral-gray-500 mt-0.5">
                        {lotName}
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
                    <div className="bg-vaca-green/5 rounded-lg p-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-vaca-green/10 flex items-center justify-center">
                        <Tag className="h-4 w-4 text-vaca-green" />
                      </div>
                      <div>
                        <p className="text-xs text-vaca-neutral-gray-600">
                          {tc("availableToSell")}
                        </p>
                        <p className="text-sm font-semibold text-vaca-neutral-gray-900">
                          {availableShares.toLocaleString()} {t("shares")}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Input
                        label={tc("sharesToSell")}
                        type="number"
                        inputSize="sm"
                        fullWidth
                        value={sharesAmount}
                        onChange={(e) => setSharesAmount(e.target.value)}
                        placeholder={tc("enterAmount")}
                        min={1}
                        max={availableShares}
                        error={
                          parsedShares > availableShares
                            ? tc("exceedsAvailable")
                            : undefined
                        }
                      />
                      {parsedShares > 0 && parsedShares <= availableShares && (
                        <p className="mt-0.5 text-xs text-vaca-neutral-gray-500">
                          {((parsedShares / availableShares) * 100).toFixed(1)}%{" "}
                          {tc("ofPosition")}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="font-inter text-xs font-medium text-vaca-neutral-gray-700 mb-1.5 block">
                        {tc("paymentCurrency")}
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
                          {tc("strkPrivate")}
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
                          {tc("arsFiat")}
                        </button>
                      </div>
                    </div>

                    <Input
                      label={
                        isStrk
                          ? tc("pricePerShareStrk")
                          : tc("pricePerShareArs")
                      }
                      type="number"
                      inputSize="sm"
                      fullWidth
                      value={pricePerShare}
                      onChange={(e) => setPricePerShare(e.target.value)}
                      placeholder={isStrk ? "0.00" : tc("enterAmount")}
                      min={isStrk ? 0 : 1}
                      step={isStrk ? "0.0001" : "1"}
                      helperText={
                        isStrk ? tc("strkHelperText") : tc("arsHelperText")
                      }
                    />

                    {isValidForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-vaca-neutral-gray-50 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-vaca-neutral-gray-600">
                            {tc("totalOfferValue")}
                          </span>
                          <span className="text-lg font-bold text-vaca-green">
                            {formatValue(totalValue)}
                          </span>
                        </div>
                        {isStrk ? (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-vaca-green">
                            <Shield className="h-3 w-3" />
                            <span>{tc("privateNoFees")}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-vaca-neutral-gray-500 mt-1">
                            {tc("feeDeducted", { fee: formatValue(sellerFee) })}
                          </p>
                        )}
                      </motion.div>
                    )}

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
                      {t("cancel")}
                    </Button>
                    <Button
                      variant="primary"
                      colorScheme="green"
                      size="sm"
                      onClick={handleSubmit}
                      disabled={!isValidForm || createOffer.isPending}
                      className="flex-1"
                    >
                      {createOffer.isPending
                        ? tc("creating")
                        : tc("createButton")}
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
