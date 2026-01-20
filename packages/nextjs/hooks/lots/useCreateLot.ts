import { useMutation } from "@tanstack/react-query";

import { createLot, type CreateLotInput } from "~~/lib/api/lots";

export function useCreateLot() {
  return useMutation({
    mutationFn: (input: CreateLotInput) => createLot(input),
  });
}
