"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
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
  const rawSignature = await account.signMessage(
    challenge.typedData as TypedData,
  );
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
      return [
        sig.r?.toString?.() ?? String(sig.r),
        sig.s?.toString?.() ?? String(sig.s),
      ];
    }
  }

  return [];
}

type LinkWalletOptions = {
  onLinkFailed?: () => void;
  messages?: {
    linkFailed: string;
    alreadyLinked: string;
  };
};

export function useLinkWallet(options?: LinkWalletOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: executeLinkWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: (error) => {
      console.error("Failed to link wallet:", error);

      const isAlreadyLinked =
        error instanceof Error &&
        error.message.includes("already linked");

      notification.error(
        isAlreadyLinked
          ? (options?.messages?.alreadyLinked ?? "This wallet is already linked to another account.")
          : (options?.messages?.linkFailed ?? "Could not link wallet."),
      );

      attemptedAddresses.clear();
      options?.onLinkFailed?.();
    },
  });
}

type AutoLinkParams = {
  status: "disconnected" | "connecting" | "connected" | "reconnecting";
  account?: AccountInterface;
  accountAddress?: string;
  me?: UserDto;
};

// Module-level state survives component remounts (e.g. TopBar minimal toggle)
const attemptedAddresses = new Set<string>();
const mismatchNotifiedAddresses = new Set<string>();

type AutoLinkOptions = {
  onLinkFailed?: () => void;
  messages?: {
    linkFailed: string;
    alreadyLinked: string;
    walletMismatch: string;
  };
};

export function useAutoLinkWallet(options?: AutoLinkOptions) {
  const linkWalletMutation = useLinkWallet({
    onLinkFailed: options?.onLinkFailed,
    messages: options?.messages,
  });

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

      // User has different wallet linked - disconnect and warn
      if (currentWallet && currentWallet !== normalizedAddress) {
        if (!mismatchNotifiedAddresses.has(normalizedAddress)) {
          mismatchNotifiedAddresses.add(normalizedAddress);
          notification.warning(
            options?.messages?.walletMismatch ??
              "The connected wallet does not match the one linked to your account.",
          );
        }
        options?.onLinkFailed?.();
        return;
      }

      // Already attempted this address (survives component remounts)
      if (attemptedAddresses.has(normalizedAddress)) {
        return;
      }

      // Check if signMessage is available
      if (
        typeof (account as { signMessage?: unknown }).signMessage !== "function"
      ) {
        return;
      }

      attemptedAddresses.add(normalizedAddress);
      linkWalletMutation.mutate({ account, address: normalizedAddress });
    },
    [linkWalletMutation, options?.messages?.walletMismatch],
  );

  return {
    tryLinkWallet,
    isLinking: linkWalletMutation.isPending,
  };
}
