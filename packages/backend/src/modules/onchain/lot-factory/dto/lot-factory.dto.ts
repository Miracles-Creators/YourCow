export class CreateLotOnChainDto {
  producer!: string; // renamed from issuer
  totalShares!: number;
  initialPricePerShare!: number;
  metadataHash!: string;
  tokenName!: string;
  tokenSymbol!: string;
}

export class SetLotStatusDto {
  newStatus!: number;
}
