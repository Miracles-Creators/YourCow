"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertCircle,
  ArrowDownToLine,
  Shield,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { CallData } from "starknet";

import { Button } from "~~/components/ui/Button";
import { Input } from "~~/components/ui/Input";
import { Card } from "~~/components/ui/Card";
import { useAccount } from "~~/hooks/useAccount";
import { useTransactor } from "~~/hooks/scaffold-stark/useTransactor";
import { useFundTongo, useTongoConfig } from "~~/hooks/tongo";

export interface FundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const STRK_CONTRACT =
  "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

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

type FundStep = "input" | "wallet" | "confirming" | "done" | "error";

function toWei(strk: number): string {
  return (BigInt(Math.floor(strk * 10000)) * BigInt(10 ** 14)).toString();
}

export function FundModal({ isOpen, onClose, onSuccess }: FundModalProps) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<FundStep>("input");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { account, status: walletStatus } = useAccount();
  const { writeTransaction } = useTransactor();
  const { data: config, isPending: isConfigLoading } = useTongoConfig();
  const fundTongo = useFundTongo();

  const parsedAmount = parseFloat(amount);
  const isValidAmount = parsedAmount > 0;
  const isWalletConnected = walletStatus === "connected" && !!account;
  const operatorAddress = config?.operatorAddress;

  const handleFund = useCallback(async () => {
    if (!isValidAmount || !account || !operatorAddress) return;
    setErrorMessage(null);

    const amountWei = toWei(parsedAmount);

    try {
      // Step 1: Send STRK from user's wallet to operator
      setStep("wallet");
      const transferCall = {
        contractAddress: STRK_CONTRACT,
        entrypoint: "transfer",
        calldata: CallData.compile({
          recipient: operatorAddress,
          amount: { low: amountWei, high: "0" },
        }),
      };

      const txHash = await writeTransaction([transferCall]);
      if (!txHash) throw new Error("Transaction rejected");

      // Step 2: Confirm deposit with backend (creates Tongo account + funds)
      setStep("confirming");
      await fundTongo.mutateAsync({ txHash, amount: amountWei });

      setStep("done");
      onSuccess?.();
    } catch (error) {
      setStep("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Transaction failed",
      );
    }
  }, [
    isValidAmount,
    account,
    operatorAddress,
    parsedAmount,
    writeTransaction,
    fundTongo,
    onSuccess,
  ]);

  const handleClose = () => {
    if (step === "wallet" || step === "confirming") return;
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                <div className="flex items-center justify-between p-6 border-b border-vaca-neutral-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-vaca-green/10 flex items-center justify-center">
                      <ArrowDownToLine className="h-5 w-5 text-vaca-green" />
                    </div>
                    <div>
                      <h2 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
                        Fund STRK
                      </h2>
                      <p className="text-sm text-vaca-neutral-gray-500">
                        Deposit into private balance
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

                {/* Body */}
                <div className="p-6 space-y-5">
                  {step === "done" ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <CheckCircle2 className="h-12 w-12 text-vaca-green" />
                      <p className="font-medium text-vaca-neutral-gray-900">
                        Deposit successful
                      </p>
                      <p className="text-sm text-vaca-neutral-gray-500 text-center">
                        {parsedAmount} STRK moved to your encrypted balance.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-vaca-green/5 rounded-xl p-4 flex items-start gap-3">
                        <Shield className="h-5 w-5 text-vaca-green flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-vaca-neutral-gray-600">
                          <p className="font-medium text-vaca-neutral-gray-900 mb-1">
                            How it works
                          </p>
                          <ol className="list-decimal list-inside space-y-1 text-xs">
                            <li>Enter the amount of STRK to deposit</li>
                            <li>Approve the transfer in your wallet</li>
                            <li>
                              STRK moves into your encrypted Tongo balance
                            </li>
                          </ol>
                        </div>
                      </div>

                      {!isWalletConnected && (
                        <div className="flex items-start gap-2 rounded-xl border border-vaca-warning/20 bg-vaca-warning-light px-4 py-3">
                          <AlertCircle className="h-5 w-5 text-vaca-warning flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-vaca-warning-dark">
                            Connect your Starknet wallet to fund your balance.
                          </p>
                        </div>
                      )}

                      <Input
                        label="Amount (STRK)"
                        type="number"
                        inputSize="md"
                        fullWidth
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        min={0}
                        disabled={step !== "input"}
                      />

                      {(step === "wallet" || step === "confirming") && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 rounded-xl border border-vaca-green/20 bg-vaca-green/5 px-4 py-3"
                        >
                          <Loader2 className="h-5 w-5 text-vaca-green animate-spin" />
                          <p className="text-sm text-vaca-neutral-gray-700">
                            {step === "wallet"
                              ? "Approve the transfer in your wallet..."
                              : "Moving STRK to your encrypted balance..."}
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
                            {errorMessage ?? "Something went wrong"}
                          </p>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 pt-0">
                  {step === "done" ? (
                    <Button
                      variant="primary"
                      colorScheme="green"
                      size="md"
                      onClick={handleDone}
                      className="flex-1"
                    >
                      Done
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        colorScheme="neutral"
                        size="md"
                        onClick={handleClose}
                        disabled={step === "wallet" || step === "confirming"}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        colorScheme="green"
                        size="md"
                        onClick={handleFund}
                        disabled={
                          !isValidAmount ||
                          !isWalletConnected ||
                          !operatorAddress ||
                          isConfigLoading ||
                          step === "wallet" ||
                          step === "confirming"
                        }
                        className="flex-1"
                      >
                        {isConfigLoading
                          ? "Loading..."
                          : step === "error"
                            ? "Retry"
                            : "Fund"}
                      </Button>
                    </>
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
