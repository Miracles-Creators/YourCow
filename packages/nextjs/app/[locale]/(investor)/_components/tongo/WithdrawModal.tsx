"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, ArrowUpFromLine } from "lucide-react";

import { Button } from "~~/components/ui/Button";
import { Input } from "~~/components/ui/Input";
import { Card } from "~~/components/ui/Card";
import { useWithdrawTongo, useTongoBalance } from "~~/hooks/tongo";

export interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

function formatStrk(wei: string): string {
  const value = BigInt(wei);
  const whole = value / BigInt(10 ** 18);
  const fraction = value % BigInt(10 ** 18);
  const fractionStr = fraction.toString().padStart(18, "0").slice(0, 4);
  return `${whole.toLocaleString()}.${fractionStr}`;
}

export function WithdrawModal({ isOpen, onClose, onSuccess }: WithdrawModalProps) {
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
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-vaca-blue/10 flex items-center justify-center">
                      <ArrowUpFromLine className="h-5 w-5 text-vaca-blue" />
                    </div>
                    <div>
                      <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
                        Withdraw STRK
                      </h2>
                      <p className="text-sm text-vaca-neutral-gray-500">
                        Send to your wallet
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

                <div className="p-6 space-y-5">
                  {balance && (
                    <div className="bg-vaca-neutral-gray-50 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-vaca-neutral-gray-500">
                          Available balance
                        </span>
                        <span className="font-semibold text-vaca-neutral-gray-900">
                          {formatStrk(balance.current)} STRK
                        </span>
                      </div>
                    </div>
                  )}

                  <Input
                    label="Recipient address"
                    type="text"
                    inputSize="md"
                    fullWidth
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="0x..."
                    helperText="Your Starknet wallet address"
                  />

                  <Input
                    label="Amount (STRK)"
                    type="number"
                    inputSize="md"
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
                      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                    >
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </motion.div>
                  )}
                </div>

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
                    colorScheme="blue"
                    size="md"
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
        </>
      )}
    </AnimatePresence>
  );
}
