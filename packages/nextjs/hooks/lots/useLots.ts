import { useQuery } from "@tanstack/react-query";

import { getLot, listLots } from "~~/lib/api/lots";

export function useLots() {
  const { isPending, data, error } = useQuery({
    queryKey: ["lots"],
    queryFn: listLots,
    staleTime: 60_000,
  });
  return { isPending, data, error };
}
