import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  countSolutionDigits, generateInventory, generateChallenge,
  canPlaceValue, getRemainingInventory, CHALLENGE_PATTERNS
} from '../src/challenge.mjs';
import { generate, mulberry32 } from '../src/generator.mjs';

describe('countSolutionDigits', () => {
  it('counts digits in a 4x4 Latin square', () => {
    const solution = [1,2,3,4, 2,3,4,1, 3,4,1,2, 4,1,2,3];
    const counts = countSolutionDigits(solution, 4);
    assert.equal(counts[1], 4);
    assert.equal(counts[2], 4);
    assert.equal(counts[3], 4);
    assert.equal(counts[4], 4);
  });
});

describe('CHALLENGE_PATTERNS', () => {
  it('has three patterns', () => {
    assert.deepEqual(CHALLENGE_PATTERNS, ['tight', 'loose', 'flood']);
  });
});

describe('generateInventory', () => {
  it('tight pattern matches solution counts exactly', () => {
    const puzzle = generate('easy', 42);
    assert.ok(puzzle);
    const rng = mulberry32(42);
    const inv = generateInventory(puzzle.solution, puzzle.size, rng, 'tight');
    const counts = countSolutionDigits(puzzle.solution, puzzle.size);
    for (let v = 1; v <= puzzle.size; v++) {
      assert.equal(inv[v], counts[v], `digit ${v} mismatch`);
    }
  });

  it('loose pattern adds surplus (inventory >= solution counts)', () => {
    const puzzle = generate('easy', 99);
    assert.ok(puzzle);
    const rng = mulberry32(99);
    const inv = generateInventory(puzzle.solution, puzzle.size, rng, 'loose');
    const counts = countSolutionDigits(puzzle.solution, puzzle.size);
    let totalSurplus = 0;
    for (let v = 1; v <= puzzle.size; v++) {
      assert.ok(inv[v] >= counts[v], `digit ${v}: inv ${inv[v]} < count ${counts[v]}`);
      totalSurplus += inv[v] - counts[v];
    }
    // loose should add at least some surplus
    assert.ok(totalSurplus > 0, `expected surplus > 0, got ${totalSurplus}`);
  });

  it('flood pattern adds surplus to every number', () => {
    const puzzle = generate('medium', 42);
    assert.ok(puzzle);
    const rng = mulberry32(42);
    const inv = generateInventory(puzzle.solution, puzzle.size, rng, 'flood');
    const counts = countSolutionDigits(puzzle.solution, puzzle.size);
    for (let v = 1; v <= puzzle.size; v++) {
      assert.ok(inv[v] >= counts[v] + 2, `digit ${v}: flood should add at least +2, got ${inv[v]} vs ${counts[v]}`);
    }
  });

  it('all patterns guarantee inventory >= solution counts', () => {
    for (const pattern of CHALLENGE_PATTERNS) {
      const puzzle = generate('easy', 777);
      assert.ok(puzzle);
      const rng = mulberry32(777);
      const inv = generateInventory(puzzle.solution, puzzle.size, rng, pattern);
      const counts = countSolutionDigits(puzzle.solution, puzzle.size);
      for (let v = 1; v <= puzzle.size; v++) {
        assert.ok(inv[v] >= counts[v], `${pattern}: digit ${v} inventory ${inv[v]} < needed ${counts[v]}`);
      }
    }
  });
});

describe('generateChallenge', () => {
  it('produces a challenge puzzle with inventory', () => {
    const result = generateChallenge('easy', 42);
    assert.ok(result);
    assert.ok(result.inventory);
    assert.equal(result.gameMode, 'challenge');
    assert.equal(result.pattern, 'tight');
  });

  it('accepts pattern parameter', () => {
    const result = generateChallenge('easy', 42, 'flood');
    assert.ok(result);
    assert.equal(result.pattern, 'flood');
    // flood adds +2-3 per number, so inventory total > grid size
    const total = Object.values(result.inventory).reduce((a, b) => a + b, 0);
    assert.ok(total > result.size * result.size);
  });

  it('is deterministic with same seed and pattern', () => {
    const a = generateChallenge('easy', 777, 'loose');
    const b = generateChallenge('easy', 777, 'loose');
    assert.ok(a && b);
    assert.deepEqual(a.solution, b.solution);
    assert.deepEqual(a.inventory, b.inventory);
  });
});

describe('canPlaceValue', () => {
  it('allows placement when inventory available', () => {
    assert.ok(canPlaceValue(3, { 3: 1 }, { 3: 4 }));
  });
  it('blocks placement when inventory depleted', () => {
    assert.ok(!canPlaceValue(3, { 3: 4 }, { 3: 4 }));
  });
  it('always allows delete (value 0)', () => {
    assert.ok(canPlaceValue(0, {}, {}));
  });
});

describe('getRemainingInventory', () => {
  it('computes remaining correctly', () => {
    const inv = { 1: 4, 2: 3, 3: 5 };
    const used = { 1: 2, 2: 3, 3: 1 };
    const rem = getRemainingInventory(used, inv, 3);
    assert.equal(rem[1], 2);
    assert.equal(rem[2], 0);
    assert.equal(rem[3], 4);
  });
});

describe('inventory + undo roundtrip', () => {
  it('placing and removing restores inventory', () => {
    const inv = { 1: 3, 2: 4, 3: 2, 4: 3 };
    const used = { 1: 0, 2: 0, 3: 0, 4: 0 };
    assert.ok(canPlaceValue(3, used, inv));
    used[3]++;
    assert.ok(canPlaceValue(3, used, inv));
    used[3]++;
    assert.ok(!canPlaceValue(3, used, inv));
    used[3]--;
    assert.ok(canPlaceValue(3, used, inv));
    assert.equal(getRemainingInventory(used, inv, 4)[3], 1);
  });
});
