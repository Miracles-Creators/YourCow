import { useMutation } from "@tanstack/react-query";

import { createAnimal } from "~~/lib/api/animals";

export function useCreateAnimal() {
  return useMutation({
    mutationFn: createAnimal,
  });
}
