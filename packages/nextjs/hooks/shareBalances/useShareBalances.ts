import { useQuery } from "@tanstack/react-query";

import { listShareBalances } from "~~/lib/api/shareBalances";

export function useShareBalances() {
  return useQuery({
    queryKey: ["share-balances"],
    queryFn: listShareBalances,
    staleTime: 60_000,
  });
}
