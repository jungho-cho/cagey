import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  countSolutionDigits, generateInventory, generateChallenge,
  canPlaceValue, getRemainingInventory
} from '../src/challenge.mjs';
import { generate, mulberry32 } from '../src/generator.mjs';

describe('countSolutionDigits', () => {
  it('counts digits in a 4x4 Latin square', () => {
    // Latin square: each digit 1-4 appears exactly 4 times
    const solution = [1,2,3,4, 2,3,4,1, 3,4,1,2, 4,1,2,3];
    const counts = countSolutionDigits(solution, 4);
    assert.equal(counts[1], 4);
    assert.equal(counts[2], 4);
    assert.equal(counts[3], 4);
    assert.equal(counts[4], 4);
  });
});

describe('generateInventory', () => {
  it('exact pattern matches solution counts', () => {
    const puzzle = generate('easy', 42);
    assert.ok(puzzle);
    const rng = mulberry32(42);
    const inv = generateInventory(puzzle.solution, puzzle.size, rng, 'exact');

    const counts = countSolutionDigits(puzzle.solution, puzzle.size);
    for (let v = 1; v <= puzzle.size; v++) {
      assert.equal(inv[v], counts[v], `digit ${v} mismatch`);
    }
  });

  it('inventory total equals grid size for exact pattern', () => {
    const puzzle = generate('easy', 123);
    assert.ok(puzzle);
    const rng = mulberry32(123);
    const inv = generateInventory(puzzle.solution, puzzle.size, rng, 'exact');

    const total = Object.values(inv).reduce((a, b) => a + b, 0);
    assert.equal(total, puzzle.size * puzzle.size);
  });

  it('random pattern produces inventory with values >= 1', () => {
    const puzzle = generate('easy', 99);
    assert.ok(puzzle);
    const rng = mulberry32(99);
    const inv = generateInventory(puzzle.solution, puzzle.size, rng, 'random');

    for (let v = 1; v <= puzzle.size; v++) {
      assert.ok(inv[v] >= 1, `digit ${v} has ${inv[v]}, expected >= 1`);
    }
  });

  it('pyramid pattern: smaller numbers may have less', () => {
    const puzzle = generate('medium', 42);
    assert.ok(puzzle);
    const rng = mulberry32(42);
    const inv = generateInventory(puzzle.solution, puzzle.size, rng, 'pyramid');

    for (let v = 1; v <= puzzle.size; v++) {
      assert.ok(inv[v] >= 1, `digit ${v} has ${inv[v]}, expected >= 1`);
    }
  });
});

describe('generateChallenge', () => {
  it('produces a challenge puzzle with inventory', () => {
    const result = generateChallenge('easy', 42);
    assert.ok(result);
    assert.ok(result.inventory);
    assert.equal(result.gameMode, 'challenge');
    assert.ok(result.size);
    assert.ok(result.cages);
    assert.ok(result.solution);
  });

  it('is deterministic with same seed', () => {
    const a = generateChallenge('easy', 777);
    const b = generateChallenge('easy', 777);
    assert.ok(a && b);
    assert.deepEqual(a.solution, b.solution);
    assert.deepEqual(a.inventory, b.inventory);
  });

  it('inventory keys cover 1..size', () => {
    const result = generateChallenge('medium', 42);
    assert.ok(result);
    for (let v = 1; v <= result.size; v++) {
      assert.ok(v in result.inventory, `missing key ${v}`);
      assert.ok(result.inventory[v] >= 1);
    }
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

    // Place a 3
    assert.ok(canPlaceValue(3, used, inv));
    used[3]++;
    assert.equal(getRemainingInventory(used, inv, 4)[3], 1);

    // Place another 3
    assert.ok(canPlaceValue(3, used, inv));
    used[3]++;
    assert.equal(getRemainingInventory(used, inv, 4)[3], 0);

    // Can't place more 3s
    assert.ok(!canPlaceValue(3, used, inv));

    // Undo (remove one 3)
    used[3]--;
    assert.ok(canPlaceValue(3, used, inv));
    assert.equal(getRemainingInventory(used, inv, 4)[3], 1);
  });
});
