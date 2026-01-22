import { useMutation } from "@tanstack/react-query";

import { confirmPayment } from "~~/lib/api/payments";

type ConfirmPaymentInput = {
  id: number;
  txHash?: string;
};

export function useConfirmPayment() {
  return useMutation({
    mutationFn: ({ id, txHash }: ConfirmPaymentInput) =>
      confirmPayment(id, txHash),
  });
}
