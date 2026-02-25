"use client";

import { motion } from "framer-motion";
import { Shield, ArrowDownToLine, ArrowUpFromLine, Clock } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "~~/components/ui/Card";
import { Badge } from "~~/components/ui/Badge";
import { Button } from "~~/components/ui/Button";
import { useTongoBalance } from "~~/hooks/tongo";

export interface TongoBalanceCardProps {
  onFund?: () => void;
  onWithdraw?: () => void;
  className?: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
  },
};

function formatStrk(wei: string): string {
  const value = BigInt(wei);
  const whole = value / BigInt(10 ** 18);
  const fraction = value % BigInt(10 ** 18);
  const fractionStr = fraction.toString().padStart(18, "0").slice(0, 4);
  return `${whole.toLocaleString()}.${fractionStr}`;
}

export function TongoBalanceCard({
  onFund,
  onWithdraw,
  className,
}: TongoBalanceCardProps) {
  const { data, isPending, error } = useTongoBalance();

  const current = data?.current ?? "0";
  const pending = data?.pending ?? "0";
  const hasPending = pending !== "0";

  return (
    <motion.div variants={itemVariants} className={className}>
      <Card variant="elevated" accent="green" padding="lg">
        <CardHeader className="mb-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle size="md">Private Balance</CardTitle>
              <Shield className="h-5 w-5 text-vaca-green" />
            </div>
            <Badge tone="success" size="sm">
              STRK
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="animate-pulse mt-4">
              <div className="h-8 bg-vaca-neutral-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-vaca-neutral-gray-100 rounded w-1/3" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 mt-4">
              Failed to load balance
            </p>
          ) : (
            <div className="mt-4">
              <div className="bg-vaca-neutral-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-vaca-neutral-gray-500">
                    Available
                  </span>
                  <span className="text-xs text-vaca-neutral-gray-400">
                    Encrypted on-chain
                  </span>
                </div>
                <p className="text-2xl font-bold text-vaca-neutral-gray-900">
                  {formatStrk(current)} STRK
                </p>
                {hasPending && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-vaca-neutral-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatStrk(pending)} STRK pending rollover</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="primary"
                  colorScheme="green"
                  size="sm"
                  fullWidth
                  onClick={onFund}
                  icon={<ArrowDownToLine className="h-4 w-4" />}
                >
                  Fund
                </Button>
                <Button
                  variant="outline"
                  colorScheme="neutral"
                  size="sm"
                  fullWidth
                  onClick={onWithdraw}
                  icon={<ArrowUpFromLine className="h-4 w-4" />}
                >
                  Withdraw
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
