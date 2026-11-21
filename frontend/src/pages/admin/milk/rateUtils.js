// Client-side rate preview calculation (server remains authoritative).
export function computePreviewRate(activeRateRule, f, s) {
  let rate = 40.0;
  if (activeRateRule.calculation_method === 'flat_rate') {
    rate = activeRateRule.flat_rate ?? activeRateRule.base_rate ?? 40.0;
  } else {
    const fatDiff = f - activeRateRule.base_fat;
    const snfDiff = s - activeRateRule.base_snf;
    const calculatedRate = activeRateRule.base_rate +
      (fatDiff * 10 * activeRateRule.fat_rate_step) +
      (snfDiff * 10 * activeRateRule.snf_rate_step);
    const minR = activeRateRule.min_rate || 20.0;
    const maxR = activeRateRule.max_rate || 80.0;
    rate = Math.max(minR, Math.min(calculatedRate, maxR));
  }

  return Math.round(rate * 100) / 100;
}
