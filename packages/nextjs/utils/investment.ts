export function calculateShares(amount: number, pricePerShare: number): number {
  if (!pricePerShare || pricePerShare <= 0) {
    return 0;
  }
  return Math.floor(amount / pricePerShare);
}

export function calculateParticipation(
  shares: number,
  totalShares: number,
): number {
  if (!totalShares || totalShares <= 0) {
    return 0;
  }
  return parseFloat(((shares / totalShares) * 100).toFixed(2));
}

export function calculateEstimatedReturn(
  amount: number,
  returnRangeStr: string,
): string {
  const rangeMatch = returnRangeStr.match(/(\d+)\s*-\s*(\d+)%/);
  if (rangeMatch) {
    const lowPercent = parseInt(rangeMatch[1], 10) / 100;
    const highPercent = parseInt(rangeMatch[2], 10) / 100;

    const lowReturn = Math.round(amount * lowPercent);
    const highReturn = Math.round(amount * highPercent);

    return `$${lowReturn.toLocaleString()}-$${highReturn.toLocaleString()}`;
  }

  const singleMatch = returnRangeStr.match(/(\d+)%/);
  if (!singleMatch) return "$0-$0";

  const percent = parseInt(singleMatch[1], 10) / 100;
  const projectedReturn = Math.round(amount * percent);

  return `$${projectedReturn.toLocaleString()}-$${projectedReturn.toLocaleString()}`;
}
