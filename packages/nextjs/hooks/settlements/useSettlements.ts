import { useQuery } from "@tanstack/react-query";

import { listSettlements } from "~~/lib/api/settlements";

export function useSettlements() {
  const { isPending, data, error } = useQuery({
    queryKey: ["settlements"],
    queryFn: listSettlements,
    staleTime: 60_000,
  });

  return { isPending, data, error };
}
