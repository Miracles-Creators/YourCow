export class CreateOfferDto {
  lotId!: number;
  sharesAmount!: number;
  pricePerShare!: number;
  strkPricePerShare?: string; // STRK wei as string (for STRK offers)
  currency!: string;
  idempotencyKey!: string;
}

export class AcceptOfferDto {
  sharesAmount!: number;
  idempotencyKey!: string;
}

export class BuySharesFromLotDto {
  lotId!: number;
  sharesAmount!: number;
  idempotencyKey!: string;
}
