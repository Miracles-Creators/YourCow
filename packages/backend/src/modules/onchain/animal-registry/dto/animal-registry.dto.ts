export class RegisterAnimalOnChainDto {
  animalId!: number;
  custodian!: string;
  profileHash!: string;
}

export class RegisterAnimalBatchDto {
  animalIds!: number[];
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
