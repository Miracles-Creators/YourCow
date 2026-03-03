import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  acceptOffer,
  buyPrimary,
  cancelOffer,
  createOffer,
  getMyTrades,
  getOffer,
  getOffers,
  getPortfolio,
  getPortfolioByLot,
  getPortfolioSummary,
} from "~~/lib/api/marketplace";
import type { AcceptOfferInput, BuyPrimaryInput, OfferFilters } from "~~/lib/api/schemas";

type AcceptOfferParams = {
  offerId: number;
  input: AcceptOfferInput;
};

export function useOffers(filters?: OfferFilters) {
  const { isPending, data, error, refetch } = useQuery({
    queryKey: ["offers", filters],
    queryFn: () => getOffers(filters),
    staleTime: 30_000, // 30 seconds - marketplace data should be more fresh
  });
  return { isPending, data, error, refetch };
}

export function useOffer(offerId: number) {
  const { isPending, data, error, refetch } = useQuery({
    queryKey: ["offers", offerId],
    queryFn: () => getOffer(offerId),
    staleTime: 30_000,
    enabled: offerId > 0,
  });
  return { isPending, data, error, refetch };
}

export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOffer,
    onSuccess: () => {
      // Invalidate offers list and portfolio to refresh data
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useBuyPrimary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BuyPrimaryInput) => buyPrimary(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}

export function useAcceptOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ offerId, input }: AcceptOfferParams) =>
      acceptOffer(offerId, input),
    onSuccess: (_, variables) => {
      // Invalidate the specific offer, offers list, and portfolio
      queryClient.invalidateQueries({ queryKey: ["offers", variables.offerId] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useCancelOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOffer,
    onSuccess: (_, offerId) => {
      // Invalidate the specific offer, offers list, and portfolio
      queryClient.invalidateQueries({ queryKey: ["offers", offerId] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function usePortfolio() {
  const { isPending, data, error, refetch } = useQuery({
    queryKey: ["portfolio"],
    queryFn: getPortfolio,
    staleTime: 30_000,
  });
  return { isPending, data, error, refetch };
}

export function usePortfolioByLot(lotId: number) {
  const { isPending, data, error, refetch } = useQuery({
    queryKey: ["portfolio", lotId],
    queryFn: () => getPortfolioByLot(lotId),
    staleTime: 30_000,
    enabled: lotId > 0,
  });
  return { isPending, data, error, refetch };
}

export function usePortfolioSummary() {
  const { isPending, data, error, refetch } = useQuery({
    queryKey: ["portfolio", "summary"],
    queryFn: getPortfolioSummary,
    staleTime: 60_000,
  });
  return { isPending, data, error, refetch };
}

export function useMyTrades() {
  const { isPending, data, error, refetch } = useQuery({
    queryKey: ["trades", "mine"],
    queryFn: getMyTrades,
    staleTime: 30_000,
  });
  return { isPending, data, error, refetch };
}
