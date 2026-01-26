"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import type { AccountInterface, TypedData } from "starknet";

import { getWalletLinkChallenge, linkWallet } from "~~/lib/api/auth";
import type { UserDto } from "~~/lib/api/schemas";
import { notification } from "~~/utils/scaffold-stark/notification";

type LinkWalletInput = {
  account: AccountInterface;
  address: string;
};

async function executeLinkWallet({ account, address }: LinkWalletInput) {
  const challenge = await getWalletLinkChallenge(address);
  const rawSignature = await account.signMessage(challenge.typedData as TypedData);
  const signature = normalizeSignature(rawSignature);

  if (signature.length === 0) {
    throw new Error("Invalid wallet signature format");
  }

  return linkWallet(address, signature);
}

function normalizeSignature(signature: unknown): string[] {
  if (Array.isArray(signature)) {
    return signature.map((v) => v?.toString?.() ?? String(v));
  }

  if (signature && typeof signature === "object") {
    const sig = signature as { r?: unknown; s?: unknown; signature?: unknown };
    if (Array.isArray(sig.signature)) {
      return sig.signature.map((v) => v?.toString?.() ?? String(v));
    }
    if (sig.r !== undefined && sig.s !== undefined) {
      return [sig.r?.toString?.() ?? String(sig.r), sig.s?.toString?.() ?? String(sig.s)];
    }
  }

  return [];
}

export function useLinkWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: executeLinkWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: (error) => {
      console.error("Failed to link wallet:", error);
      notification.error("No se pudo vincular la wallet");
    },
  });
}

type AutoLinkParams = {
  status: "disconnected" | "connecting" | "connected" | "reconnecting";
  account?: AccountInterface;
  accountAddress?: string;
  me?: UserDto;
};

export function useAutoLinkWallet() {
  const linkWalletMutation = useLinkWallet();
  const lastAttemptRef = useRef<string | null>(null);
  const mismatchNotifiedRef = useRef<string | null>(null);

  const tryLinkWallet = useCallback(
    ({ status, account, accountAddress, me }: AutoLinkParams) => {
      if (status !== "connected" || !accountAddress || !account || !me) {
        return;
      }

      const normalizedAddress = accountAddress.toLowerCase();
      const currentWallet = me.walletAddress?.toLowerCase();

      // Already linked to this address
      if (currentWallet === normalizedAddress) {
        return;
      }

      // User has different wallet linked - warn once
      if (currentWallet && currentWallet !== normalizedAddress) {
        if (mismatchNotifiedRef.current !== normalizedAddress) {
          mismatchNotifiedRef.current = normalizedAddress;
          notification.warning("La wallet conectada no coincide con la asociada a tu cuenta");
        }
        return;
      }

      // Already attempted this address
      if (lastAttemptRef.current === normalizedAddress) {
        return;
      }

      // Check if signMessage is available
      if (typeof (account as { signMessage?: unknown }).signMessage !== "function") {
        return;
      }

      lastAttemptRef.current = normalizedAddress;
      linkWalletMutation.mutate({ account, address: normalizedAddress });
    },
    [linkWalletMutation],
  );

  return {
    tryLinkWallet,
    isLinking: linkWalletMutation.isPending,
  };
}
