import { useQuery } from "@tanstack/react-query";

import { listShareTransfers } from "~~/lib/api/shareTransfers";

export function useShareTransfers() {
  return useQuery({
    queryKey: ["share-transfers"],
    queryFn: listShareTransfers,
    staleTime: 60_000,
  });
}
