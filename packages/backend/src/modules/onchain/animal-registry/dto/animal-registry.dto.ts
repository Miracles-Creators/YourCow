export class RegisterAnimalOnChainDto {
  animalId!: number;
  custodian!: string;
  profileHash!: string;
  initialWeightGrams!: number;
}

export class RegisterAnimalBatchDto {
  animalIds!: number[];
  initialWeightsGrams!: number[];
  custodians!: string[];
  profileHashes!: string[];
}

export class AssignToLotDto {
  lotId!: number;
}

export class AssignToLotBatchDto {
  animalIds!: number[];
  lotId!: number;
}

export class RemoveFromLotBatchDto {
  animalIds!: number[];
}

export class SetAnimalStatusDto {
  newStatus!: number;
}

export class SetAnimalStatusBatchDto {
  animalIds!: number[];
  newStatus!: number;
}

export class TransferCustodyDto {
  newCustodian!: string;
}
