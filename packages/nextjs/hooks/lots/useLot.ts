import { useQuery } from "@tanstack/react-query";

import { getLot } from "~~/lib/api/lots";

export function useLot(lotId: number) {
  const { isPending, data, error } = useQuery({
    queryKey: ["lots", lotId],
    queryFn: () => getLot(lotId),
    staleTime: 60_000,
  });
  return { isPending, data, error };
}
