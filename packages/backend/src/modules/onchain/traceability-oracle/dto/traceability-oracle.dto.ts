export class AnchorTraceDto {
  animalId!: number;
  root!: string;
  eventCount!: number;
}

export class AnchorTraceBatchDto {
  animalIds!: number[];
  roots!: string[];
  eventCounts!: number[];
}

export class CorrectTraceDto {
  animalId!: number;
  newRoot!: string;
  newEventCount!: number;
  correctionReason!: string;
}
