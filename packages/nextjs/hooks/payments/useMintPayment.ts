import { useMutation } from "@tanstack/react-query";

import { mintPayment } from "~~/lib/api/payments";

type MintPaymentInput = {
  id: number;
};

export function useMintPayment() {
  return useMutation({
    mutationFn: ({ id }: MintPaymentInput) => mintPayment(id),
  });
}
