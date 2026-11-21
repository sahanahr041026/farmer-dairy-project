import { describe, it, expect } from 'vitest';
import { getCharStats } from './smsHelpers';

describe('getCharStats', () => {
  it('treats plain ASCII as single-part up to 160 characters', () => {
    expect(getCharStats('a'.repeat(160))).toEqual({ charLength: 160, isUnicode: false, maxSingle: 160, parts: 1 });
    expect(getCharStats('a'.repeat(161)).parts).toBe(2);
  });
  it('detects Kannada text as Unicode (70 / 67 per part)', () => {
    const s = getCharStats('ಹಾಲು ಸಂಗ್ರಹ');
    expect(s.isUnicode).toBe(true);
    expect(s.maxSingle).toBe(70);
    expect(getCharStats('ಹ'.repeat(71)).parts).toBe(2);
  });
  it('handles an empty message', () => {
    expect(getCharStats('')).toEqual({ charLength: 0, isUnicode: false, maxSingle: 160, parts: 1 });
  });
});
