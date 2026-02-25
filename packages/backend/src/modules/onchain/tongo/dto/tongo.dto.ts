export class DepositConfirmDto {
  txHash!: string;
  amount!: string; // STRK wei as string
}

export class WithdrawDto {
  toAddress!: string; // Starknet address to receive STRK
  amount!: string; // STRK wei as string
}
