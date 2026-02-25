import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getTongoBalance, getTongoConfig, confirmDeposit, withdrawTongo } from "~~/lib/api/tongo";


//TODO:compare this pattern with the one used in producers
export function useTongoBalance() {
  const { isPending, data, error, refetch } = useQuery({
    queryKey: ["tongo-balance"],
    queryFn: getTongoBalance,
    staleTime: 15_000,
  });
  return { isPending, data, error, refetch };
}

export function useTongoConfig() {
  return useQuery({
    queryKey: ["tongo-config"],
    queryFn: getTongoConfig,
    staleTime: Infinity,
  });
}

export function useFundTongo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmDeposit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tongo-balance"] });
    },
  });
}

export function useWithdrawTongo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withdrawTongo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tongo-balance"] });
    },
  });
}
