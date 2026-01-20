import { useQuery } from "@tanstack/react-query";

import { getProducer } from "~~/lib/api/producers";

export function useProducer(id: number) {
  return useQuery({
    queryKey: ["producers", id],
    queryFn: () => getProducer(id),
    enabled: Boolean(id),
  });
}
