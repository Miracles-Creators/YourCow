"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, ArrowUpFromLine } from "lucide-react";

import { Button } from "~~/components/ui/Button";
import { Input } from "~~/components/ui/Input";
import { Card } from "~~/components/ui/Card";
import { useWithdrawTongo, useTongoBalance } from "~~/hooks/tongo";
import { formatStrkWei } from "~~/utils/scaffold-stark/common";
import { overlayVariants, modalVariants } from "../animations";

export interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function WithdrawModal({
  isOpen,
  onClose,
  onSuccess,
}: WithdrawModalProps) {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const withdrawTongo = useWithdrawTongo();
  const { data: balance } = useTongoBalance();

  const parsedAmount = parseFloat(amount);
  const isValidForm =
    toAddress.startsWith("0x") && toAddress.length > 10 && parsedAmount > 0;

  const amountWei = isValidForm
    ? (BigInt(Math.floor(parsedAmount * 10000)) * BigInt(10 ** 14)).toString()
    : "0";

  const handleSubmit = useCallback(async () => {
    if (!isValidForm) return;
    setErrorMessage(null);

    try {
      await withdrawTongo.mutateAsync({ toAddress, amount: amountWei });
      onSuccess?.();
      onClose();
      setToAddress("");
      setAmount("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to withdraw",
      );
    }
  }, [isValidForm, withdrawTongo, toAddress, amountWei, onSuccess, onClose]);

  const handleClose = () => {
    setToAddress("");
    setAmount("");
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
                  <div className="flex items-center justify-between px-4 py-3 border-b border-vaca-neutral-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-vaca-blue/10 flex items-center justify-center">
                        <ArrowUpFromLine className="h-4 w-4 text-vaca-blue" />
                      </div>
                      <div>
                        <h2 className="font-playfair text-lg font-semibold text-vaca-neutral-gray-900">
                          Withdraw STRK
                        </h2>
                        <p className="text-xs text-vaca-neutral-gray-500">
                          Send to your wallet
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

                  <div className="px-4 py-3 space-y-3">
                    {balance && (
                      <div className="bg-vaca-neutral-gray-50 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-vaca-neutral-gray-500">
                            Available balance
                          </span>
                          <span className="font-semibold text-vaca-neutral-gray-900">
                            {formatStrkWei(balance.current)} STRK
                          </span>
                        </div>
                      </div>
                    )}

                    <Input
                      label="Recipient address"
                      type="text"
                      inputSize="sm"
                      fullWidth
                      value={toAddress}
                      onChange={(e) => setToAddress(e.target.value)}
                      placeholder="0x..."
                      helperText="Your Starknet wallet address"
                    />

                    <Input
                      label="Amount (STRK)"
                      type="number"
                      inputSize="sm"
                      fullWidth
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min={0}
                      helperText="Amount to withdraw"
                    />

                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 rounded-xl border border-vaca-error/20 bg-vaca-error-light px-4 py-3"
                      >
                        <AlertCircle className="h-5 w-5 text-vaca-error flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-vaca-error-dark">
                          {errorMessage}
                        </p>
                      </motion.div>
                    )}
                  </div>

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
                      colorScheme="blue"
                      size="sm"
                      onClick={handleSubmit}
                      disabled={!isValidForm || withdrawTongo.isPending}
                      className="flex-1"
                    >
                      {withdrawTongo.isPending ? "Withdrawing..." : "Withdraw"}
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
