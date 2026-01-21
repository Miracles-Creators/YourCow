import { useQuery } from "@tanstack/react-query";

import { listShareTransfersByLot } from "~~/lib/api/shareTransfers";

export function useShareTransfersByLot(lotId?: number) {
  return useQuery({
    queryKey: ["share-transfers", "lot", lotId],
    queryFn: () => listShareTransfersByLot(lotId as number),
    enabled: Boolean(lotId),
    staleTime: 60_000,
  });
}
