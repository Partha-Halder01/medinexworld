export function normalizePlatformFeePercent(value: unknown): number {
  return Math.min(100, Math.max(0, Number(value) || 0));
}

export function calculateTotalWithPlatformFee(
  baseAmount: unknown,
  platformFeePercent: unknown
): number {
  const base = Math.max(0, Number(baseAmount) || 0);
  const percent = normalizePlatformFeePercent(platformFeePercent);
  return Math.round(base * (1 + percent / 100));
}

export function calculatePlatformFeeFromTotal(
  totalAmount: unknown,
  platformFeePercent: unknown
): number {
  const total = Math.max(0, Number(totalAmount) || 0);
  const percent = normalizePlatformFeePercent(platformFeePercent);
  if (percent <= 0 || total <= 0) return 0;
  return Math.min(total, Math.round((total * percent) / (100 + percent)));
}

export function splitAmountByPlatformFee(
  totalAmount: unknown,
  platformFeePercent: unknown
): {
  grossAmount: number;
  netAmount: number;
  platformFeeAmount: number;
  platformFeePercent: number;
} {
  const grossAmount = Math.max(0, Number(totalAmount) || 0);
  const percent = normalizePlatformFeePercent(platformFeePercent);
  const platformFeeAmount = calculatePlatformFeeFromTotal(grossAmount, percent);
  const netAmount = Math.max(0, grossAmount - platformFeeAmount);

  return {
    grossAmount,
    netAmount,
    platformFeeAmount,
    platformFeePercent: percent,
  };
}
