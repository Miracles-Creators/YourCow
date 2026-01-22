export class CreatePaymentDto {
  paymentIntentId!: string;
  investorId!: number;
  lotId!: number;
  amountFiat!: number;
  currency!: string;
  sharesAmount!: number;
  txHash?: string;
}
