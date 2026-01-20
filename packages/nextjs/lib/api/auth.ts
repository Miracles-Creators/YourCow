import { apiFetch } from "./client";
import { UserSchema, type UserDto } from "./schemas";

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
