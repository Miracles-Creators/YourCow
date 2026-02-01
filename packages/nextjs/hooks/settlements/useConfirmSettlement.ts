import { useMutation } from "@tanstack/react-query";

import { confirmSettlement } from "~~/lib/api/settlements";

export function useConfirmSettlement() {
  return useMutation({
    mutationFn: confirmSettlement,
  });
}
