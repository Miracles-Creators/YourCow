export class CreateLotOnChainDto {
  producer!: string; // renamed from issuer
  totalShares!: string;
  initialPricePerShare!: string;
  metadataHash!: string;
  tokenName!: string;
  tokenSymbol!: string;
}

export class SetLotStatusDto {
  newStatus!: number;
}
