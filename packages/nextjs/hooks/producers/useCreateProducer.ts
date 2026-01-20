import { useMutation } from "@tanstack/react-query";

import { createProducer } from "~~/lib/api/producers";

export function useCreateProducer() {
  return useMutation({
    mutationFn: createProducer,
  });
}
