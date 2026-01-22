import { useMutation } from "@tanstack/react-query";

import { createPayment } from "~~/lib/api/payments";

export function useCreatePayment() {
  return useMutation({
    mutationFn: createPayment,
  });
}
