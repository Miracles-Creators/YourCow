import { useMutation, useQueryClient } from "@tanstack/react-query";

import { simulateDeposit } from "~~/lib/api/payments";

export function useSimulateDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amountFiat: number) => simulateDeposit(amountFiat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}
