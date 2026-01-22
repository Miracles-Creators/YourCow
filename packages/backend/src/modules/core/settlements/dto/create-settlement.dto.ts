export class CreateSettlementDto {
  lotId!: number;
  totalProceeds!: number;
  currency?: string;
  finalReportHash!: string;
  finalReportUrl?: string;
  finalTotalWeightGrams!: number;
  finalAverageWeightGrams!: number;
  initialTotalWeightGrams!: number;
}
