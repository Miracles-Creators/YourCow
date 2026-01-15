export class AnchorTraceDto {
  animalId!: string;
  root!: string;
  eventCount!: number;
}

export class AnchorTraceBatchDto {
  animalIds!: string[];
  roots!: string[];
  eventCounts!: number[];
}

export class CorrectTraceDto {
  animalId!: string;
  newRoot!: string;
  newEventCount!: number;
  correctionReason!: string;
}
