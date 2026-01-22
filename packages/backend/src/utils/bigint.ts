export const toBigInt = (value: number | string | bigint): bigint => {
  if (typeof value === "number" && !Number.isSafeInteger(value)) {
    throw new Error("Value must be a safe integer");
  }
  return BigInt(value);
};
