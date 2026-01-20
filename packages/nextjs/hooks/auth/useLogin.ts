import { useMutation } from "@tanstack/react-query";

import { loginWithEmail } from "~~/lib/api/auth";

type LoginInput = {
  email: string;
  name?: string;
  role?: "INVESTOR" | "PRODUCER" | "ADMIN";
};

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, name, role }: LoginInput) =>
      loginWithEmail(email, name, role),
  });
}
