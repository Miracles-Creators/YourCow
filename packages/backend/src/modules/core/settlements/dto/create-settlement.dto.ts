export class CreateSettlementDto {
  lotId!: string;
  totalProceeds!: string; // Decimal as string
  currency?: string;
  finalReportHash!: string;
  finalReportUrl?: string;
  finalTotalWeightGrams!: number;
  finalAverageWeightGrams!: number;
  initialTotalWeightGrams!: number;
}
