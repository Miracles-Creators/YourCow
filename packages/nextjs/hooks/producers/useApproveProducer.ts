import { useMutation } from "@tanstack/react-query";

import { approveProducer } from "~~/lib/api/producers";

export function useApproveProducer() {
  return useMutation({
    mutationFn: approveProducer,
  });
}
