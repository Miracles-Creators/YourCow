import { apiFetch } from "./client";
import {
  UserSchema,
  WalletChallengeSchema,
  type UserDto,
  type WalletChallengeDto,
} from "./schemas";

export async function loginWithEmail(
  email: string,
  name?: string,
  role?: "INVESTOR" | "PRODUCER" | "ADMIN",
): Promise<UserDto> {
  const user = await apiFetch<UserDto>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, name, role }),
  });

  return UserSchema.parse(user);
}

export async function getMe(): Promise<UserDto> {
  const user = await apiFetch<UserDto>("/auth/me");
  return UserSchema.parse(user);
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}

export async function getWalletLinkChallenge(
  address: string,
): Promise<WalletChallengeDto> {
  const challenge = await apiFetch<WalletChallengeDto>("/auth/wallet/challenge", {
    method: "POST",
    body: JSON.stringify({ address }),
  });
  return WalletChallengeSchema.parse(challenge);
}

export async function linkWallet(
  address: string,
  signature: string[],
): Promise<UserDto> {
  const user = await apiFetch<UserDto>("/auth/wallet/link", {
    method: "POST",
    body: JSON.stringify({ address, signature }),
  });
  return UserSchema.parse(user);
}
