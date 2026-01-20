import { useQuery } from "@tanstack/react-query";

import { getProducerMe } from "~~/lib/api/producers";

export function useProducerMe() {
  return useQuery({
    queryKey: ["producers", "me"],
    queryFn: getProducerMe,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
