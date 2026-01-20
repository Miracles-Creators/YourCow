export class CreatePaymentDto {
  paymentIntentId!: string;
  investorId!: number;
  lotId!: number;
  amountFiat!: number;
  currency!: string;
  sharesAmount!: string;
  txHash?: string;
}
