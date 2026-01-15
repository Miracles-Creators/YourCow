export class RegisterAnimalOnChainDto {
  animalId!: string;
  custodian!: string;
  profileHash!: string;
}

export class RegisterAnimalBatchDto {
  animalIds!: string[];
  custodians!: string[];
  profileHashes!: string[];
}

export class AssignToLotDto {
  lotId!: string;
}

export class AssignToLotBatchDto {
  animalIds!: string[];
  lotId!: string;
}

export class RemoveFromLotBatchDto {
  animalIds!: string[];
}

export class SetAnimalStatusDto {
  newStatus!: number;
}

export class SetAnimalStatusBatchDto {
  animalIds!: string[];
  newStatus!: number;
}

export class TransferCustodyDto {
  newCustodian!: string;
}
