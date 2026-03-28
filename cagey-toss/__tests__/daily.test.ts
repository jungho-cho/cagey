import { getDailyPuzzleIndex, isNewDay } from '../src/engine/daily';

describe('getDailyPuzzleIndex', () => {
  test('same date returns same puzzle index', () => {
    const date = new Date('2025-06-15T10:00:00Z');
    const idx1 = getDailyPuzzleIndex(100, date);
    const idx2 = getDailyPuzzleIndex(100, date);
    expect(idx1).toBe(idx2);
  });

  test('different date returns different puzzle index', () => {
    const date1 = new Date('2025-06-15T10:00:00Z');
    const date2 = new Date('2025-06-16T10:00:00Z');
    const idx1 = getDailyPuzzleIndex(100, date1);
    const idx2 = getDailyPuzzleIndex(100, date2);
    expect(idx1).not.toBe(idx2);
  });

  test('returns index within bundle range', () => {
    const date = new Date('2025-06-15T10:00:00Z');
    const idx = getDailyPuzzleIndex(50, date);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(50);
  });
});

describe('isNewDay', () => {
  test('same date returns false', () => {
    // 2025-06-15 10:00 UTC = 2025-06-15 19:00 KST
    const now = new Date('2025-06-15T10:00:00Z');
    expect(isNewDay('2025-06-15', now)).toBe(false);
  });

  test('different date returns true', () => {
    // 2025-06-16 10:00 UTC = 2025-06-16 19:00 KST
    const now = new Date('2025-06-16T10:00:00Z');
    expect(isNewDay('2025-06-15', now)).toBe(true);
  });
});
