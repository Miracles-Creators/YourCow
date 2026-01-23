import { useMutation } from "@tanstack/react-query";

import { approveAnimalsBatch } from "~~/lib/api/animals";

export function useApproveAnimals() {
  return useMutation({
    mutationFn: approveAnimalsBatch,
  });
}
