import { apiFetch } from "./client";
import {
  CreateOfferInputSchema,
  AcceptOfferInputSchema,
  BuyPrimaryInputSchema,
  BuyPrimaryResultSchema,
  OfferSchema,
  TradeSchema,
  PortfolioSchema,
  PortfolioLotItemSchema,
  type CreateOfferInput,
  type AcceptOfferInput,
  type BuyPrimaryInput,
  type BuyPrimaryResult,
  type OfferDto,
  type TradeDto,
  type PortfolioDto,
  type PortfolioLotItemDto,
  type OfferFilters,
} from "./schemas";

// ============================================
// OFFER ENDPOINTS
// ============================================

/**
 * List all offers with optional filters
 */
export async function getOffers(filters?: OfferFilters): Promise<OfferDto[]> {
  const params = new URLSearchParams();

  if (filters?.lotId) params.append("lotId", String(filters.lotId));
  if (filters?.sellerId) params.append("sellerId", String(filters.sellerId));
  if (filters?.status) params.append("status", filters.status);

  const query = params.toString();
  const path = query ? `/offers?${query}` : "/offers";

  const offers = await apiFetch<OfferDto[]>(path);
  return OfferSchema.array().parse(offers);
}

/**
 * Get a single offer by ID
 */
export async function getOffer(id: number): Promise<OfferDto> {
  const offer = await apiFetch<OfferDto>(`/offers/${id}`);
  return OfferSchema.parse(offer);
}

/**
 * Create a new sell offer
 * Requires authenticated user with KYC approval
 */
export async function createOffer(input: CreateOfferInput): Promise<OfferDto> {
  const parsed = CreateOfferInputSchema.parse(input);
  const offer = await apiFetch<OfferDto>("/offers", {
    method: "POST",
    body: JSON.stringify(parsed),
  });
  return OfferSchema.parse(offer);
}

/**
 * Accept an offer (buy shares)
 * Requires authenticated user with KYC approval
 */
export async function acceptOffer(
  offerId: number,
  input: AcceptOfferInput,
): Promise<TradeDto> {
  const parsed = AcceptOfferInputSchema.parse(input);
  const trade = await apiFetch<TradeDto>(`/offers/${offerId}/accept`, {
    method: "POST",
    body: JSON.stringify(parsed),
  });
  return TradeSchema.parse(trade);
}

/**
 * Buy shares from primary market (custodial flow)
 */
export async function buyPrimary(
  input: BuyPrimaryInput,
): Promise<BuyPrimaryResult> {
  const parsed = BuyPrimaryInputSchema.parse(input);
  const result = await apiFetch<BuyPrimaryResult>("/offers/buy-primary", {
    method: "POST",
    body: JSON.stringify(parsed),
  });
  return BuyPrimaryResultSchema.parse(result);
}

/**
 * Cancel an offer
 * Only the seller can cancel their own offer
 */
export async function cancelOffer(offerId: number): Promise<OfferDto> {
  const offer = await apiFetch<OfferDto>(`/offers/${offerId}/cancel`, {
    method: "POST",
  });
  return OfferSchema.parse(offer);
}

// ============================================
// PORTFOLIO ENDPOINTS
// ============================================

/**
 * Get the current user's full portfolio
 * Includes fiat balances and all lot positions
 */
export async function getPortfolio(): Promise<PortfolioDto> {
  const portfolio = await apiFetch<PortfolioDto>("/portfolio");
  return PortfolioSchema.parse(portfolio);
}

/**
 * Get the current user's position in a specific lot
 * Includes available/locked shares and active offers
 */
export async function getPortfolioByLot(
  lotId: number,
): Promise<PortfolioLotItemDto> {
  const position = await apiFetch<PortfolioLotItemDto>(`/portfolio/${lotId}`);
  return PortfolioLotItemSchema.parse(position);
}
