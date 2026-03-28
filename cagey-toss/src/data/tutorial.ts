/**
 * Cagey -- Tutorial Puzzle Data
 *
 * 3 hardcoded mini puzzles that introduce the game mechanics step by step.
 *
 * Grid values use row-major flat arrays.
 * `prefilled[i] = true` means the cell is pre-filled and locked.
 * `0` in the grid means empty (player must fill it).
 */

import type { Cage } from '../engine/types';

export interface TutorialStep {
  stepNumber: number;
  instruction: string;
  grid: number[];
  puzzle: {
    size: number;
    cages: Cage[];
  };
  prefilled: boolean[];
}

/**
 * Step 1: 2x2 grid, 1 empty cell.
 * Teaches basic cage arithmetic (addition).
 *
 * Solution: [[1, 2], [2, 1]]
 * Grid layout:
 *   [ _, 2 ]
 *   [ 2, 1 ]
 *
 * Cage: cells [0,1] op '+' target 3  -> player fills 1
 */
const step1: TutorialStep = {
  stepNumber: 1,
  instruction: '케이지 안 숫자의 합이 3이 되도록 빈 칸을 채우세요!',
  grid: [0, 2, 2, 1],
  puzzle: {
    size: 2,
    cages: [
      { cells: [0, 1], op: '+', target: 3 },
      { cells: [2, 3], op: '+', target: 3 },
    ],
  },
  prefilled: [false, true, true, true],
};

/**
 * Step 2: 3x3 grid, 2 empty cells.
 * Introduces multiplication cages alongside addition.
 *
 * Solution: [[1, 2, 3], [3, 1, 2], [2, 3, 1]]
 * Grid layout:
 *   [ _, 2, 3 ]
 *   [ 3, _, 2 ]
 *   [ 2, 3, 1 ]
 *
 * Cages:
 *   [0,1]  +  target 3   -> player fills 1
 *   [2,5]  *  target 6   -> prefilled
 *   [3,6]  +  target 5   -> prefilled
 *   [4,7]  *  target 3   -> player fills 1
 *   [8]    +  target 1   -> prefilled (single-cell cage for tutorial simplicity)
 */
const step2: TutorialStep = {
  stepNumber: 2,
  instruction: '이번에는 곱셈(\u00d7) 케이지도 있어요!',
  grid: [0, 2, 3, 3, 0, 2, 2, 3, 1],
  puzzle: {
    size: 3,
    cages: [
      { cells: [0, 1], op: '+', target: 3 },
      { cells: [2, 5], op: '*', target: 6 },
      { cells: [3, 6], op: '+', target: 5 },
      { cells: [4, 7], op: '*', target: 3 },
      { cells: [8], op: '+', target: 1 },
    ],
  },
  prefilled: [false, true, true, true, false, true, true, true, true],
};

/**
 * Step 3: 4x4 grid, all empty -- free solve.
 *
 * Solution: [[1,2,3,4], [3,4,1,2], [2,1,4,3], [4,3,2,1]]
 *
 * Cages designed so cage-only constraints uniquely determine the solution:
 *   [0,1]    +  3
 *   [2,3]    *  12
 *   [4,5,8]  +  9
 *   [6,7]    +  3
 *   [9,13]   *  12
 *   [10,11]  +  5
 *   [12,14,15] + 7
 */
const step3: TutorialStep = {
  stepNumber: 3,
  instruction: '이제 직접 풀어보세요! 모든 케이지를 완성하면 클리어!',
  grid: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  puzzle: {
    size: 4,
    cages: [
      { cells: [0, 1], op: '+', target: 3 },
      { cells: [2, 3], op: '*', target: 12 },
      { cells: [4, 5, 8], op: '+', target: 9 },
      { cells: [6, 7], op: '+', target: 3 },
      { cells: [9, 13], op: '*', target: 12 },
      { cells: [10, 11], op: '+', target: 5 },
      { cells: [12, 14, 15], op: '+', target: 7 },
    ],
  },
  prefilled: new Array(16).fill(false),
};

export const TUTORIAL_STEPS: TutorialStep[] = [step1, step2, step3];
