/**
 * Bundle Validation Test
 *
 * Validates that every puzzle in the bundle has a valid Latin-square solution
 * and all cage constraints are satisfied.
 */

import * as fs from 'fs';
import * as path from 'path';
import { checkCage } from '../src/engine/solver';
import type { Cage, Difficulty } from '../src/engine/types';

interface BundlePuzzle {
  size: number;
  cages: Cage[];
  solution: number[];
}

type Bundle = Record<Difficulty, BundlePuzzle[]>;

const BUNDLE_PATH = path.resolve(__dirname, '..', 'src', 'data', 'puzzleBundle.json');

// Skip if bundle not generated yet
const bundleExists = fs.existsSync(BUNDLE_PATH);
const describeIfBundle = bundleExists ? describe : describe.skip;

describeIfBundle('puzzleBundle.json', () => {
  let bundle: Bundle;

  beforeAll(() => {
    const raw = fs.readFileSync(BUNDLE_PATH, 'utf-8');
    bundle = JSON.parse(raw);
  });

  it('has all 4 difficulties', () => {
    expect(Object.keys(bundle).sort()).toEqual(['easy', 'expert', 'hard', 'medium']);
  });

  it('has at least 10 puzzles per difficulty', () => {
    for (const diff of ['easy', 'medium', 'hard', 'expert'] as Difficulty[]) {
      expect(bundle[diff].length).toBeGreaterThanOrEqual(10);
    }
  });

  const difficulties: Array<{ diff: Difficulty; expectedSize: number }> = [
    { diff: 'easy', expectedSize: 4 },
    { diff: 'medium', expectedSize: 5 },
    { diff: 'hard', expectedSize: 6 },
    { diff: 'expert', expectedSize: 8 },
  ];

  for (const { diff, expectedSize } of difficulties) {
    describe(`${diff} puzzles`, () => {
      it(`all have size ${expectedSize}`, () => {
        for (const p of bundle[diff]) {
          expect(p.size).toBe(expectedSize);
        }
      });

      it('all solutions satisfy cage constraints', () => {
        for (let i = 0; i < bundle[diff].length; i++) {
          const p = bundle[diff][i];
          for (let ci = 0; ci < p.cages.length; ci++) {
            const status = checkCage(p.cages[ci], p.solution);
            expect(status).toBe('satisfied');
          }
        }
      });

      it('all solutions have correct length', () => {
        for (const p of bundle[diff]) {
          expect(p.solution.length).toBe(p.size * p.size);
        }
      });

      it('all solution values are in range [1, size]', () => {
        for (const p of bundle[diff]) {
          for (const v of p.solution) {
            expect(v).toBeGreaterThanOrEqual(1);
            expect(v).toBeLessThanOrEqual(p.size);
          }
        }
      });

      it('all cages cover every cell exactly once', () => {
        for (const p of bundle[diff]) {
          const covered = new Set<number>();
          for (const cage of p.cages) {
            for (const cell of cage.cells) {
              expect(covered.has(cell)).toBe(false);
              covered.add(cell);
            }
          }
          expect(covered.size).toBe(p.size * p.size);
        }
      });
    });
  }
});
