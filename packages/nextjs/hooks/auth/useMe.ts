import { useQuery } from "@tanstack/react-query";

import { getMe } from "~~/lib/api/auth";

export function useMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    staleTime: 60_000,
    retry: false,
  });
}
