import { useQuery } from "@tanstack/react-query";

import { listShareTransfersByInvestor } from "~~/lib/api/shareTransfers";

export function useShareTransfersByInvestor(investorId?: number) {
  return useQuery({
    queryKey: ["share-transfers", "investor", investorId],
    queryFn: () => listShareTransfersByInvestor(investorId as number),
    enabled: Boolean(investorId),
    staleTime: 60_000,
  });
}
