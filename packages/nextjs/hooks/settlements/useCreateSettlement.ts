import { useMutation } from "@tanstack/react-query";

import { createSettlement } from "~~/lib/api/settlements";

export function useCreateSettlement() {
  return useMutation({
    mutationFn: createSettlement,
  });
}
