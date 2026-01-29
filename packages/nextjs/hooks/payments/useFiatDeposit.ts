import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fiatDeposit } from "~~/lib/api/payments";

type FiatDepositInput = {
  id: number;
};

export function useFiatDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: FiatDepositInput) => fiatDeposit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}
