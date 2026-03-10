"use client";

import { ShieldCheck, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface FundraisingProof {
  thresholdPercent: number;
  verified: boolean;
  txHash: string;
  provedAt: string;
}

interface FundraisingProofBadgeProps {
  proof: FundraisingProof;
}

const VOYAGER_BASE = "https://sepolia.voyager.online/tx";

export function FundraisingProofBadge({ proof }: FundraisingProofBadgeProps) {
  if (!proof.verified) return null;

  const voyagerUrl = `${VOYAGER_BASE}/${proof.txHash}`;
  const provedDate = new Date(proof.provedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
      className="rounded-xl border border-vaca-green/20 bg-vaca-green/5 p-4"
    >
      <div className="flex items-start gap-3">
        <ShieldCheck
          className="mt-0.5 h-5 w-5 shrink-0 text-vaca-green"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-vaca-green">
            ZK Verified: Above {proof.thresholdPercent}% funded
          </p>
          <p className="mt-0.5 text-xs text-vaca-text-secondary">
            Proof verified on Starknet · {provedDate}
          </p>
          <p className="mt-1 text-xs text-vaca-text-secondary/70">
            Total shares and amounts are hidden — only the threshold is proven.
          </p>
          <a
            href={voyagerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-vaca-green underline-offset-2 hover:underline"
            aria-label="View ZK verification transaction on Voyager block explorer"
          >
            View verification on Voyager
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
