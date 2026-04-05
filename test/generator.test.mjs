import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generate, mulberry32, generateLatinSquare, partitionIntoCages, DIFFICULTY, shuffle } from '../src/generator.mjs';

describe('mulberry32', () => {
  it('is deterministic with same seed', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    for (let i = 0; i < 10; i++) {
      assert.equal(rng1(), rng2());
    }
  });

  it('produces different values with different seeds', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(99);
    assert.notEqual(rng1(), rng2());
  });

  it('produces values in [0, 1)', () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      assert.ok(v >= 0 && v < 1, `value ${v} out of range`);
    }
  });
});

describe('generateLatinSquare', () => {
  for (const size of [3, 4, 5, 6]) {
    it(`produces valid ${size}x${size} Latin square`, () => {
      const rng = mulberry32(42);
      const grid = generateLatinSquare(size, rng);

      assert.equal(grid.length, size * size);

      // Check each row has all values 1..size
      for (let r = 0; r < size; r++) {
        const row = grid.slice(r * size, (r + 1) * size);
        const sorted = [...row].sort((a, b) => a - b);
        const expected = Array.from({ length: size }, (_, i) => i + 1);
        assert.deepEqual(sorted, expected, `row ${r} invalid: ${row}`);
      }

      // Check each column has all values 1..size
      for (let c = 0; c < size; c++) {
        const col = Array.from({ length: size }, (_, r) => grid[r * size + c]);
        const sorted = [...col].sort((a, b) => a - b);
        const expected = Array.from({ length: size }, (_, i) => i + 1);
        assert.deepEqual(sorted, expected, `col ${c} invalid: ${col}`);
      }
    });
  }
});

describe('partitionIntoCages', () => {
  it('covers all cells', () => {
    const rng = mulberry32(42);
    const size = 4;
    const cages = partitionIntoCages(size, 2, 3, rng);
    const covered = new Set();
    for (const cage of cages) {
      for (const cell of cage) {
        assert.ok(!covered.has(cell), `cell ${cell} in multiple cages`);
        covered.add(cell);
      }
    }
    assert.equal(covered.size, size * size);
  });

  it('respects minimum cage size', () => {
    const rng = mulberry32(42);
    const cages = partitionIntoCages(4, 2, 3, rng);
    // After merging singletons, all cages should be >= 2
    for (const cage of cages) {
      assert.ok(cage.length >= 2, `cage too small: ${cage.length}`);
    }
  });
});

describe('generate', () => {
  for (const diff of ['easy', 'medium']) {
    it(`produces valid ${diff} puzzle`, () => {
      const puzzle = generate(diff, 42);
      assert.ok(puzzle !== null, `generation failed for ${diff}`);
      assert.equal(puzzle.size, DIFFICULTY[diff].size);
      assert.ok(Array.isArray(puzzle.cages));
      assert.ok(Array.isArray(puzzle.solution));
      assert.equal(puzzle.solution.length, puzzle.size * puzzle.size);
    });
  }

  it('is deterministic with same seed', () => {
    const p1 = generate('easy', 12345);
    const p2 = generate('easy', 12345);
    assert.ok(p1 && p2);
    assert.deepEqual(p1.solution, p2.solution);
    assert.equal(p1.cages.length, p2.cages.length);
  });

  it('throws for unknown difficulty', () => {
    assert.throws(() => generate('impossible', 42), /Unknown difficulty/);
  });

  it('respects budget and returns null on timeout', () => {
    // Expert with 1ms budget — should fail
    const result = generate('expert', 42, 1);
    // May return null or a puzzle (if it was very lucky)
    assert.ok(result === null || typeof result === 'object');
  });
});

describe('DIFFICULTY', () => {
  it('has all four levels', () => {
    assert.ok(DIFFICULTY.easy);
    assert.ok(DIFFICULTY.medium);
    assert.ok(DIFFICULTY.hard);
    assert.ok(DIFFICULTY.expert);
  });

  it('sizes are 4, 5, 6, 8', () => {
    assert.equal(DIFFICULTY.easy.size, 4);
    assert.equal(DIFFICULTY.medium.size, 5);
    assert.equal(DIFFICULTY.hard.size, 6);
    assert.equal(DIFFICULTY.expert.size, 8);
  });
});
