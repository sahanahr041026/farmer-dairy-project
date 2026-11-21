import { describe, it, expect } from 'vitest';
import { computePreviewRate } from './rateUtils';

const formula = {
  calculation_method: 'fat_snf_formula', base_rate: 41, base_fat: 4, base_snf: 8.5,
  fat_rate_step: 0.45, snf_rate_step: 0.3, min_rate: 20, max_rate: 80, flat_rate: 40,
};

describe('computePreviewRate', () => {
  it('applies the fat/SNF formula', () => {
    expect(computePreviewRate(formula, 4.4, 8.7)).toBeCloseTo(43.4, 2);
  });
  it('clamps to the rule bounds', () => {
    expect(computePreviewRate(formula, 20, 20)).toBe(80);
    expect(computePreviewRate(formula, 0, 0)).toBe(20);
  });
  it('uses the flat rate for flat_rate rules and falls back to base_rate', () => {
    expect(computePreviewRate({ ...formula, calculation_method: 'flat_rate' }, 9, 9)).toBe(40);
    expect(computePreviewRate({ ...formula, calculation_method: 'flat_rate', flat_rate: undefined }, 9, 9)).toBe(41);
  });
});
