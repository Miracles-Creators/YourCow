export class CreatePaymentDto {
  paymentIntentId!: string;
  investorId!: string;
  lotId!: string;
  amountFiat!: number;
  currency!: string;
  sharesAmount!: string;
  txHash?: string;
}
