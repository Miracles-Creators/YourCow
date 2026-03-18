"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowDownToLine,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "~~/components/ui/Button";
import { Input } from "~~/components/ui/Input";
import { Card } from "~~/components/ui/Card";
import { useSimulateDeposit } from "~~/hooks/payments/useSimulateDeposit";
import { overlayVariants, modalVariants } from "../animations";

export interface FiatDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DepositStep = "input" | "processing" | "success" | "error";

export function FiatDepositModal({ isOpen, onClose }: FiatDepositModalProps) {
  const t = useTranslations("investor.trade");

  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<DepositStep>("input");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const simulateDeposit = useSimulateDeposit();

  const parsedAmount = parseFloat(amount);
  const isValidAmount = parsedAmount > 0;
  const centavos = Math.round(parsedAmount * 100);

  const handleDeposit = useCallback(async () => {
    if (!isValidAmount) return;
    setErrorMessage(null);

    try {
      setStep("processing");
      await simulateDeposit.mutateAsync(centavos);
      setStep("success");
    } catch (error) {
      setStep("error");
      setErrorMessage(
        error instanceof Error ? error.message : t("depositFailed"),
      );
    }
  }, [isValidAmount, centavos, simulateDeposit, t]);

  const handleClose = () => {
    if (step === "processing") return;
    setAmount("");
    setStep("input");
    setErrorMessage(null);
    onClose();
  };

  const handleDone = () => {
    setAmount("");
    setStep("input");
    setErrorMessage(null);
    onClose();
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
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-vaca-green/10 flex items-center justify-center">
                        <ArrowDownToLine className="h-4 w-4 text-vaca-green" />
                      </div>
                      <div>
                        <h2 className="font-playfair text-lg font-semibold text-vaca-neutral-gray-900">
                          {t("depositArs")}
                        </h2>
                        <p className="text-xs text-vaca-neutral-gray-500">
                          {t("addFunds")}
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

                  {/* Body */}
                  <div className="px-4 py-3 space-y-3">
                    {step === "success" ? (
                      <div className="flex flex-col items-center gap-3 py-4">
                        <CheckCircle2 className="h-12 w-12 text-vaca-green" />
                        <p className="font-medium text-vaca-neutral-gray-900">
                          {t("depositSuccess")}
                        </p>
                        <p className="text-sm text-vaca-neutral-gray-500 text-center">
                          {t("depositAdded", {
                            amount: parsedAmount.toLocaleString("es-AR"),
                          })}
                        </p>
                      </div>
                    ) : (
                      <>
                        <Input
                          label={t("depositAmount")}
                          type="number"
                          inputSize="sm"
                          fullWidth
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="25,000"
                          min={0}
                          disabled={step === "processing"}
                        />

                        {step === "processing" && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 rounded-xl border border-vaca-green/20 bg-vaca-green/5 px-4 py-3"
                          >
                            <Loader2 className="h-5 w-5 text-vaca-green animate-spin" />
                            <p className="text-sm text-vaca-neutral-gray-700">
                              {t("processing")}
                            </p>
                          </motion.div>
                        )}

                        {(errorMessage || step === "error") && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-2 rounded-xl border border-vaca-error/20 bg-vaca-error-light px-4 py-3"
                          >
                            <AlertCircle className="h-5 w-5 text-vaca-error flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-vaca-error-dark">
                              {errorMessage ?? t("somethingWrong")}
                            </p>
                          </motion.div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex gap-2 px-4 py-3 border-t border-vaca-neutral-gray-100">
                    {step === "success" ? (
                      <Button
                        variant="primary"
                        colorScheme="green"
                        size="sm"
                        onClick={handleDone}
                        className="flex-1"
                      >
                        {t("done")}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          colorScheme="neutral"
                          size="sm"
                          onClick={handleClose}
                          disabled={step === "processing"}
                          className="flex-1"
                        >
                          {t("cancel")}
                        </Button>
                        <Button
                          variant="primary"
                          colorScheme="green"
                          size="sm"
                          onClick={handleDeposit}
                          disabled={!isValidAmount || step === "processing"}
                          className="flex-1"
                        >
                          {step === "error" ? t("retry") : t("depositButton")}
                        </Button>
                      </>
                    )}
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
