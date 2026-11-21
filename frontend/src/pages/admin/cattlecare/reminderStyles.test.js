import { describe, it, expect } from 'vitest';
import { getReminderColors } from './reminderStyles';

describe('getReminderColors', () => {
  it('maps each status to a distinct accent', () => {
    const accents = ['overdue', 'due_soon', 'completed', 'cancelled', 'upcoming'].map((s) => getReminderColors(s).borderAccent);
    expect(new Set(accents).size).toBe(5);
  });
  it('uses the red palette for overdue reminders', () => {
    expect(getReminderColors('overdue')).toEqual({ borderAccent: '#dc2626', badgeBg: '#fee2e2', badgeColor: '#b91c1c' });
  });
});
