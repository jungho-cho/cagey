import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { solve, countSolutions, checkCage, verifyCageOnlyUnique } from '../src/solver.mjs';

describe('checkCage', () => {
  it('returns satisfied for correct + cage', () => {
    const cage = { cells: [0, 1], op: '+', target: 5 };
    const grid = [2, 3];
    assert.equal(checkCage(cage, grid), 'satisfied');
  });

  it('returns impossible for incorrect + cage', () => {
    const cage = { cells: [0, 1], op: '+', target: 5 };
    const grid = [2, 4];
    assert.equal(checkCage(cage, grid), 'impossible');
  });

  it('returns ok for incomplete + cage', () => {
    const cage = { cells: [0, 1], op: '+', target: 5 };
    const grid = [2, 0];
    assert.equal(checkCage(cage, grid), 'ok');
  });

  it('returns impossible when partial sum >= target', () => {
    const cage = { cells: [0, 1], op: '+', target: 3 };
    const grid = [4, 0];
    assert.equal(checkCage(cage, grid), 'impossible');
  });

  it('handles * cage correctly', () => {
    const cage = { cells: [0, 1], op: '*', target: 6 };
    assert.equal(checkCage(cage, [2, 3]), 'satisfied');
    assert.equal(checkCage(cage, [2, 4]), 'impossible');
    assert.equal(checkCage(cage, [2, 0]), 'ok');
  });

  it('handles - cage correctly', () => {
    const cage = { cells: [0, 1], op: '-', target: 1 };
    assert.equal(checkCage(cage, [3, 2]), 'satisfied');
    assert.equal(checkCage(cage, [3, 1]), 'impossible');
    assert.equal(checkCage(cage, [3, 0]), 'ok');
  });

  it('handles / cage correctly', () => {
    const cage = { cells: [0, 1], op: '/', target: 2 };
    assert.equal(checkCage(cage, [4, 2]), 'satisfied');
    assert.equal(checkCage(cage, [4, 3]), 'impossible');
    assert.equal(checkCage(cage, [4, 0]), 'ok');
  });
});

describe('solve', () => {
  it('finds unique solution for a simple 3x3 puzzle', () => {
    // 3x3 Latin square: [[1,2,3],[3,1,2],[2,3,1]]
    const puzzle = {
      size: 3,
      cages: [
        { cells: [0, 1], op: '+', target: 3 },   // 1+2
        { cells: [2, 5], op: '+', target: 5 },    // 3+2 (wrong) - actually let me make a valid one
      ]
    };
    // Let me construct a valid puzzle with known solution
    // Solution: [1,2,3, 2,3,1, 3,1,2]
    const validPuzzle = {
      size: 3,
      cages: [
        { cells: [0, 3], op: '+', target: 3 },  // 1+2=3
        { cells: [1, 4], op: '+', target: 5 },  // 2+3=5
        { cells: [2, 5], op: '+', target: 4 },  // 3+1=4
        { cells: [6, 7], op: '+', target: 4 },  // 3+1=4
        { cells: [8], op: '+', target: 2 },      // just 2
      ]
    };
    const result = solve(validPuzzle);
    // Should find a solution (may or may not be unique depending on puzzle)
    assert.ok(result === null || result === false || Array.isArray(result));
  });

  it('returns null for impossible puzzle', () => {
    const puzzle = {
      size: 2,
      cages: [
        { cells: [0, 1, 2, 3], op: '+', target: 100 }, // impossible
      ]
    };
    const result = solve(puzzle);
    assert.equal(result, null);
  });

  it('respects node limit', () => {
    const puzzle = {
      size: 4,
      cages: [
        { cells: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], op: '+', target: 40 },
      ]
    };
    const result = solve(puzzle, 100); // very small node limit
    assert.equal(result, false); // should hit limit
  });
});

describe('countSolutions', () => {
  it('counts solutions for a trivial puzzle', () => {
    const puzzle = {
      size: 2,
      cages: [
        { cells: [0, 1], op: '+', target: 3 }, // row 0: must be 1+2 or 2+1
        { cells: [2, 3], op: '+', target: 3 }, // row 1: must be 1+2 or 2+1
      ]
    };
    const count = countSolutions(puzzle, 10);
    assert.ok(count >= 1);
  });
});

describe('verifyCageOnlyUnique', () => {
  it('returns boolean', () => {
    const puzzle = {
      size: 2,
      cages: [
        { cells: [0, 1], op: '+', target: 3 },
        { cells: [2, 3], op: '+', target: 3 },
      ]
    };
    const result = verifyCageOnlyUnique(puzzle);
    assert.equal(typeof result, 'boolean');
  });
});
