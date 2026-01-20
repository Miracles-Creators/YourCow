import { useQuery } from "@tanstack/react-query";

import { listProducers } from "~~/lib/api/producers";

export function useProducers() {
  const { isPending, data, error } = useQuery({
    queryKey: ["producers"],
    queryFn: listProducers,
    staleTime: 60_000,
  });
  return { isPending, data, error };
}
