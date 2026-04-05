import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDailyInfo, formatTime, buildShareText, DIFF_DESCRIPTIONS } from '../src/engine.mjs';

describe('getDailyInfo', () => {
  it('returns puzzle info for a given date', () => {
    const info = getDailyInfo('2026-04-01');
    assert.equal(info.puzzleNum, 1);
    assert.ok(['easy', 'medium', 'hard', 'expert'].includes(info.diff));
    assert.equal(typeof info.seed, 'number');
  });

  it('is deterministic for same date', () => {
    const a = getDailyInfo('2026-04-05');
    const b = getDailyInfo('2026-04-05');
    assert.equal(a.puzzleNum, b.puzzleNum);
    assert.equal(a.diff, b.diff);
    assert.equal(a.seed, b.seed);
  });

  it('cycles through difficulties', () => {
    const diffs = [];
    for (let d = 0; d < 4; d++) {
      const date = `2026-04-0${d + 1}`;
      diffs.push(getDailyInfo(date).diff);
    }
    // Should cycle through all 4 difficulties
    const unique = new Set(diffs);
    assert.equal(unique.size, 4);
  });
});

describe('formatTime', () => {
  it('formats seconds correctly', () => {
    assert.equal(formatTime(0), '0:00');
    assert.equal(formatTime(5), '0:05');
    assert.equal(formatTime(65), '1:05');
    assert.equal(formatTime(3600), '60:00');
  });
});

describe('buildShareText', () => {
  it('builds share text with correct format', () => {
    const hintMask = [false, false, false, false, true, false, false, false, false];
    const text = buildShareText(42, 'Easy', 65, 1, 3, hintMask, 3);
    assert.ok(text.includes('Cagey #42'));
    assert.ok(text.includes('[Easy]'));
    assert.ok(text.includes('1:05'));
    assert.ok(text.includes('1 hint'));
    assert.ok(text.includes('3\uD83D\uDD25'));
    assert.ok(text.includes('playcagey.com'));
  });

  it('shows no hints when 0', () => {
    const hintMask = new Array(4).fill(false);
    const text = buildShareText(1, 'Easy', 30, 0, 1, hintMask, 2);
    assert.ok(text.includes('No hints'));
  });

  it('includes custom URL for daily page', () => {
    const hintMask = new Array(4).fill(false);
    const text = buildShareText(1, 'Easy', 30, 0, 1, hintMask, 2, { type: 'daily', date: '2026-04-05', locale: 'ko' });
    assert.ok(text.includes('playcagey.com/ko/daily/2026-04-05'));
  });
});

describe('DIFF_DESCRIPTIONS', () => {
  it('has descriptions for all difficulties', () => {
    assert.ok(DIFF_DESCRIPTIONS.easy);
    assert.ok(DIFF_DESCRIPTIONS.medium);
    assert.ok(DIFF_DESCRIPTIONS.hard);
    assert.ok(DIFF_DESCRIPTIONS.expert);
  });
});
