import { useQuery } from "@tanstack/react-query";

import { listShareBalancesByInvestor } from "~~/lib/api/shareBalances";

export function useShareBalancesByInvestor(investorId?: number) {
  return useQuery({
    queryKey: ["share-balances", "investor", investorId],
    queryFn: () => listShareBalancesByInvestor(investorId as number),
    enabled: Boolean(investorId),
    staleTime: 60_000,
  });
}
