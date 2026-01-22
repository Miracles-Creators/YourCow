import { useMutation } from "@tanstack/react-query";

import { createProducer, CreateProducerInput } from "~~/lib/api/producers";

export function useCreateProducer() {
  return useMutation({
    mutationFn: (data: CreateProducerInput) => createProducer(data),
  });
}
