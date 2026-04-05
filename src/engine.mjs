/**
 * Cagey — Engine utilities (ESM)
 *
 * Pure functions with no DOM dependency: daily challenge, streak, share text, time formatting.
 */

import { mulberry32 } from './generator.mjs';

const DIFFS = ['easy', 'medium', 'hard', 'expert'];
const LAUNCH_DATE = new Date('2026-04-01T00:00:00Z');

export function getDailyInfo(dateOverride) {
  const now = dateOverride ? new Date(dateOverride + 'T00:00:00Z') : new Date();
  const utcNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dayIndex = Math.floor((utcNow - LAUNCH_DATE.getTime()) / 86400000);
  const puzzleNum = Math.max(1, dayIndex + 1);
  const diff = DIFFS[((dayIndex % 4) + 4) % 4];
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seed = mulberry32(parseInt(dateStr))();
  return { puzzleNum, diff, seed: (seed * 0xFFFFFFFF) >>> 0 };
}

export function formatTime(secs) {
  const m = (secs / 60) | 0;
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function buildShareText(puzzleNum, diffLabel, timeSecs, hintsUsed, streak, hintMask, size, pageInfo) {
  let emojiGrid = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const idx = r * size + c;
      emojiGrid += hintMask[idx] ? '\u2B1B' : '\uD83D\uDFE9';
    }
    if (r < size - 1) emojiGrid += '\n';
  }
  const timeStr = formatTime(timeSecs);
  const hintStr = hintsUsed === 0 ? 'No hints' : `${hintsUsed} hint${hintsUsed > 1 ? 's' : ''} used`;
  const pg = pageInfo || {};
  const locale = pg.locale || 'en';
  let url = 'playcagey.com';
  if (pg.type === 'daily' && pg.date) {
    url = `playcagey.com/${locale}/daily/${pg.date}`;
  }
  return `Cagey #${puzzleNum} [${diffLabel}] \u2713 ${timeStr}\n${emojiGrid}\n${hintStr} \u00B7 ${streak}\uD83D\uDD25\n${url}`;
}

export const DIFF_DESCRIPTIONS = {
  easy: 'Fill each cage so the numbers add up to the target. Use numbers 1-4. No row or column rules \u2014 just arithmetic!',
  medium: 'Use addition and multiplication to hit each cage target. Numbers 1-5. Each number appears only once per row.',
  hard: 'All four operations: add, subtract, multiply, divide. Numbers 1-6. Each number appears once per row and column \u2014 like Sudoku!',
  expert: 'The ultimate cage puzzle challenge. Numbers 1-8, all four operations, full row and column uniqueness. Can you master the 8\u00D78 grid?',
};
