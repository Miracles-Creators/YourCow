import { useQuery } from "@tanstack/react-query";

import { listAnimalsByLot } from "~~/lib/api/animals";

export function useAnimalsByLot(lotId: number) {
  return useQuery({
    queryKey: ["animals", "lot", lotId],
    queryFn: () => listAnimalsByLot(lotId),
    enabled: Boolean(lotId),
  });
}
