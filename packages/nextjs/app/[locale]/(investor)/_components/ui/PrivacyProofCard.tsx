"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Copy, Check, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGenerateProof } from "~~/hooks/garaga/useGenerateProof";
import { FundraisingProofBadge } from "../garaga/FundraisingProofBadge";

const VOYAGER_BASE = "https://sepolia.voyager.online/tx";

interface FundraisingProof {
  thresholdPercent: number;
  verified: boolean;
  txHash: string;
  provedAt: string;
}

interface PrivacyProofCardProps {
  lotId: number;
  fundraisingProof: FundraisingProof | null;
}

function TxHashRow({ txHash }: { txHash: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const short = `${txHash.slice(0, 10)}…${txHash.slice(-6)}`;

  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl border border-vaca-green/20 bg-vaca-neutral-white px-3 py-2">
      <span className="flex-1 truncate font-mono text-[11px] text-vaca-neutral-gray-500">
        {short}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy transaction hash"
        className="shrink-0 text-vaca-neutral-gray-400 transition hover:text-vaca-green"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-vaca-green" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
      <a
        href={`${VOYAGER_BASE}/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View transaction on Voyager"
        className="shrink-0 text-vaca-neutral-gray-400 transition hover:text-vaca-green"
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </div>
  );
}

export function PrivacyProofCard({
  lotId,
  fundraisingProof,
}: PrivacyProofCardProps) {
  const t = useTranslations("investor.lotDetail");
  const proof = useGenerateProof(lotId);

  const resolvedProof: FundraisingProof | null =
    fundraisingProof ??
    (proof.status === "done" && proof.txHash
      ? {
          thresholdPercent: 100,
          verified: true,
          txHash: proof.txHash,
          provedAt: new Date().toISOString(),
        }
      : null);

  return (
    <div className="rounded-2xl bg-vaca-green/5 p-5">
      <p className="font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
        {t("privateMetrics.title")}
      </p>
      <p className="mt-2 font-inter text-2xl font-bold text-vaca-neutral-gray-900">
        {t("privateMetrics.hidden")}
      </p>
      <p className="mt-1 font-inter text-xs text-vaca-neutral-gray-500">
        {t("privateMetrics.hint")}
      </p>

      <div className="mt-4 border-t border-vaca-green/10" />

      <div className="mt-4">
        {resolvedProof ? (
          <>
            <FundraisingProofBadge proof={resolvedProof} />
            <TxHashRow txHash={resolvedProof.txHash} />
          </>
        ) : proof.status === "idle" ? (
          <button
            type="button"
            onClick={proof.generate}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-vaca-green/30 px-3 py-2 text-xs font-semibold text-vaca-green transition hover:border-vaca-green hover:bg-vaca-green/5"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t("privateMetrics.verifyButton")}
          </button>
        ) : proof.status === "failed" ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-red-500">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{proof.error ?? t("privateMetrics.verifyFailed")}</span>
            </div>
            <button
              type="button"
              onClick={proof.generate}
              className="text-xs font-semibold text-vaca-green underline-offset-2 hover:underline"
            >
              {t("privateMetrics.retryButton")}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-vaca-neutral-gray-500">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-vaca-green border-t-transparent"
              aria-hidden="true"
            />
            <span>
              {proof.status === "pending" && t("privateMetrics.statusPending")}
              {proof.status === "proving" && t("privateMetrics.statusProving")}
              {proof.status === "verifying" &&
                t("privateMetrics.statusVerifying")}
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
