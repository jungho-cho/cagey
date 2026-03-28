import { createGameState } from '../src/engine/gameState';
import type { PuzzleWithSolution } from '../src/engine/types';

/**
 * Test fixture: 4x4 puzzle with known solution.
 *
 * Solution:
 *   1 2 3 4
 *   3 4 1 2
 *   4 3 2 1
 *   2 1 4 3
 */
const TEST_PUZZLE: PuzzleWithSolution = {
  size: 4,
  solution: [1, 2, 3, 4, 3, 4, 1, 2, 4, 3, 2, 1, 2, 1, 4, 3],
  cages: [
    { cells: [0, 1], op: '+', target: 3 },    // 1+2
    { cells: [2, 3], op: '*', target: 12 },   // 3*4
    { cells: [4, 5], op: '+', target: 7 },    // 3+4
    { cells: [6, 7], op: '+', target: 3 },    // 1+2
    { cells: [8, 9], op: '+', target: 7 },    // 4+3
    { cells: [10, 11], op: '+', target: 3 },  // 2+1
    { cells: [12, 13], op: '+', target: 3 },  // 2+1
    { cells: [14, 15], op: '+', target: 7 },  // 4+3
  ],
};

describe('setCellValue', () => {
  test('new value pushes to undo stack', () => {
    const gs = createGameState(TEST_PUZZLE);
    gs.setCellValue(0, 1);
    expect(gs.grid[0]).toBe(1);
    expect(gs.getUndoDepth()).toBe(1);
  });

  test('same value is no-op', () => {
    const gs = createGameState(TEST_PUZZLE);
    gs.setCellValue(0, 3);
    gs.setCellValue(0, 3); // same value again
    expect(gs.getUndoDepth()).toBe(1); // only one undo entry
  });
});

describe('undo', () => {
  test('restores previous value', () => {
    const gs = createGameState(TEST_PUZZLE);
    gs.setCellValue(0, 5);
    gs.setCellValue(0, 3);
    gs.undo();
    expect(gs.grid[0]).toBe(5);
  });

  test('empty stack returns false', () => {
    const gs = createGameState(TEST_PUZZLE);
    expect(gs.undo()).toBe(false);
  });
});

describe('getCageStatus', () => {
  test('all filled correct returns correct', () => {
    const gs = createGameState(TEST_PUZZLE);
    // Cage 0: cells [0,1], target 3 (+), solution 1+2=3
    gs.setCellValue(0, 1);
    gs.setCellValue(1, 2);
    expect(gs.getCageStatus(0)).toBe('correct');
  });

  test('all filled incorrect returns incorrect', () => {
    const gs = createGameState(TEST_PUZZLE);
    // Cage 0: cells [0,1], target 3 (+), but we fill 4+4=8
    gs.setCellValue(0, 4);
    gs.setCellValue(1, 4);
    expect(gs.getCageStatus(0)).toBe('incorrect');
  });

  test('has zeros returns incomplete', () => {
    const gs = createGameState(TEST_PUZZLE);
    gs.setCellValue(0, 1);
    // cell 1 is still 0
    expect(gs.getCageStatus(0)).toBe('incomplete');
  });
});

describe('isPuzzleComplete', () => {
  test('all correct returns true', () => {
    const gs = createGameState(TEST_PUZZLE);
    // Fill entire grid with correct solution
    const solution = TEST_PUZZLE.solution;
    for (let i = 0; i < solution.length; i++) {
      gs.setCellValue(i, solution[i]);
    }
    expect(gs.isPuzzleComplete()).toBe(true);
  });
});

describe('revealHint', () => {
  test('sets value without undo entry', () => {
    const gs = createGameState(TEST_PUZZLE);
    gs.revealHint(0, 1);
    expect(gs.grid[0]).toBe(1);
    expect(gs.getUndoDepth()).toBe(0); // no undo entry
  });
});
