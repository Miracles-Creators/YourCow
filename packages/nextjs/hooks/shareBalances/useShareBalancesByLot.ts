import { useQuery } from "@tanstack/react-query";

import { listShareBalancesByLot } from "~~/lib/api/shareBalances";

export function useShareBalancesByLot(lotId?: number) {
  return useQuery({
    queryKey: ["share-balances", "lot", lotId],
    queryFn: () => listShareBalancesByLot(lotId as number),
    enabled: Boolean(lotId),
    staleTime: 60_000,
  });
}
