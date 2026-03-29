/**
 * Cagey -- Backtracking Solver
 *
 * Two solvers:
 *  1. Latin-square solver (fast) -- used during generation for quick uniqueness check
 *  2. Cage-only solver (slower) -- verifies that cage constraints ALONE uniquely
 *     determine the solution, with NO hidden row/col rules.
 *
 * The generation pipeline: Latin-square solver filters first (fast), then cage-only
 * solver confirms the puzzle is fair for the player (no hidden constraints needed).
 */

import type { Cage, CageStatus, Puzzle } from './types';

interface SolverState {
  nodes: number;
  nodeLimit: number;
}

/**
 * Check whether a partially-filled cage is feasible.
 * vals: array of cell values (0 = unfilled)
 * Returns 'satisfied' | 'ok' | 'impossible'
 */
export function checkCage(cage: Cage, grid: number[]): CageStatus {
  const vals = cage.cells.map(i => grid[i]);
  const filled = vals.filter(v => v !== 0);
  const empty = vals.length - filled.length;

  if (cage.op === '+') {
    const sum = filled.reduce((a, b) => a + b, 0);
    if (empty === 0) return sum === cage.target ? 'satisfied' : 'impossible';
    if (sum >= cage.target) return 'impossible';
    return 'ok';
  } else if (cage.op === '*') {
    const prod = filled.reduce((a, b) => a * b, 1);
    if (empty === 0) return prod === cage.target ? 'satisfied' : 'impossible';
    if (cage.target % prod !== 0) return 'impossible';
    return 'ok';
  } else if (cage.op === '-') {
    if (vals.length !== 2) return 'impossible';
    if (empty === 0) return Math.abs(filled[0] - filled[1]) === cage.target ? 'satisfied' : 'impossible';
    return 'ok';
  } else {
    // '/'
    if (vals.length !== 2) return 'impossible';
    if (empty === 0) {
      const mx = Math.max(filled[0], filled[1]);
      const mn = Math.min(filled[0], filled[1]);
      return (mn !== 0 && mx / mn === cage.target && mx % mn === 0) ? 'satisfied' : 'impossible';
    }
    return 'ok';
  }
}

/**
 * Build cellIndex -> cage index map.
 */
function buildCellCageMap(puzzle: Puzzle): number[] {
  const map = new Array(puzzle.size * puzzle.size).fill(-1);
  puzzle.cages.forEach((cage, ci) => {
    cage.cells.forEach(idx => {
      map[idx] = ci;
    });
  });
  return map;
}

/**
 * Enhanced cage feasibility check with tighter bounds.
 * Catches impossible branches earlier than checkCage (especially for multiplication).
 */
export function checkCageTight(cage: Cage, grid: number[], maxVal: number): CageStatus {
  const vals = cage.cells.map(i => grid[i]);
  const filled = vals.filter(v => v !== 0);
  const empty = vals.length - filled.length;

  if (cage.op === '+') {
    const sum = filled.reduce((a, b) => a + b, 0);
    if (empty === 0) return sum === cage.target ? 'satisfied' : 'impossible';
    if (sum >= cage.target) return 'impossible';
    // Lower bound: each remaining cell is at least 1
    if (sum + empty > cage.target) return 'impossible';
    // Upper bound: each remaining cell is at most maxVal
    if (sum + empty * maxVal < cage.target) return 'impossible';
    return 'ok';
  } else if (cage.op === '*') {
    const prod = filled.reduce((a, b) => a * b, 1);
    if (empty === 0) return prod === cage.target ? 'satisfied' : 'impossible';
    if (cage.target % prod !== 0) return 'impossible';
    // Upper bound: remaining cells are at most maxVal each
    if (prod * Math.pow(maxVal, empty) < cage.target) return 'impossible';
    // Lower bound: remaining cells are at least 1
    if (prod > cage.target) return 'impossible';
    return 'ok';
  } else if (cage.op === '-') {
    if (vals.length !== 2) return 'impossible';
    if (empty === 0) return Math.abs(filled[0] - filled[1]) === cage.target ? 'satisfied' : 'impossible';
    // With one value filled, check if any value 1..maxVal can satisfy |filled - x| = target
    if (filled.length === 1) {
      const v = filled[0];
      if (v + cage.target > maxVal && v - cage.target < 1) return 'impossible';
    }
    return 'ok';
  } else {
    // '/'
    if (vals.length !== 2) return 'impossible';
    if (empty === 0) {
      const mx = Math.max(filled[0], filled[1]);
      const mn = Math.min(filled[0], filled[1]);
      return (mn !== 0 && mx / mn === cage.target && mx % mn === 0) ? 'satisfied' : 'impossible';
    }
    if (filled.length === 1) {
      const v = filled[0];
      // v / x = target => x = v / target (must be integer, 1..maxVal)
      // x / v = target => x = v * target (must be <= maxVal)
      const canDivide = cage.target !== 0 && v % cage.target === 0 && v / cage.target >= 1 && v / cage.target <= maxVal;
      const canMultiply = v * cage.target <= maxVal;
      if (!canDivide && !canMultiply) return 'impossible';
    }
    return 'ok';
  }
}

/**
 * Core recursive backtracking solver with row/col uniqueness pruning.
 */
function _solve(
  grid: number[],
  pos: number,
  puzzle: Puzzle,
  cellCageMap: number[],
  rowUsed: number[],
  colUsed: number[],
  solutions: number[][],
  stopAt: number,
  state: SolverState,
): void {
  if (solutions.length >= stopAt) return;
  if (++state.nodes > state.nodeLimit) return;

  const { size } = puzzle;
  const total = size * size;

  // Skip already-filled cells
  while (pos < total && grid[pos] !== 0) pos++;

  if (pos === total) {
    for (const cage of puzzle.cages) {
      if (checkCage(cage, grid) !== 'satisfied') return;
    }
    solutions.push(grid.slice());
    return;
  }

  const row = (pos / size) | 0;
  const col = pos % size;
  const cageIdx = cellCageMap[pos];
  const cage = puzzle.cages[cageIdx];

  for (let val = 1; val <= size; val++) {
    const bit = 1 << val;
    // Row/col uniqueness pruning
    if (rowUsed[row] & bit) continue;
    if (colUsed[col] & bit) continue;

    grid[pos] = val;
    rowUsed[row] |= bit;
    colUsed[col] |= bit;

    if (checkCage(cage, grid) !== 'impossible') {
      _solve(grid, pos + 1, puzzle, cellCageMap, rowUsed, colUsed, solutions, stopAt, state);
      if (solutions.length >= stopAt || state.nodes > state.nodeLimit) {
        grid[pos] = 0;
        rowUsed[row] &= ~bit;
        colUsed[col] &= ~bit;
        return;
      }
    }

    grid[pos] = 0;
    rowUsed[row] &= ~bit;
    colUsed[col] &= ~bit;
  }
}

/**
 * Solve a puzzle.
 * Returns:
 *  - number[]  -> unique solution (flat row-major array)
 *  - null      -> no solution
 *  - false     -> multiple solutions OR node limit exceeded (treat as "retry")
 */
export function solve(puzzle: Puzzle, nodeLimit: number = Infinity): number[] | null | false {
  if (puzzle.size > 30) throw new Error(`Grid size ${puzzle.size} exceeds bitmask capacity (max 30)`);
  const { size } = puzzle;
  const grid = new Array(size * size).fill(0);
  const cellCageMap = buildCellCageMap(puzzle);
  const rowUsed = new Array(size).fill(0);
  const colUsed = new Array(size).fill(0);
  const solutions: number[][] = [];
  const state: SolverState = { nodes: 0, nodeLimit };
  _solve(grid, 0, puzzle, cellCageMap, rowUsed, colUsed, solutions, 2, state);

  if (state.nodes > state.nodeLimit) return false; // timed out
  if (solutions.length === 0) return null;
  if (solutions.length === 1) return solutions[0];
  return false;
}

/**
 * Count solutions up to `limit`.
 */
export function countSolutions(puzzle: Puzzle, limit: number = 2): number {
  const { size } = puzzle;
  const grid = new Array(size * size).fill(0);
  const cellCageMap = buildCellCageMap(puzzle);
  const rowUsed = new Array(size).fill(0);
  const colUsed = new Array(size).fill(0);
  const solutions: number[][] = [];
  const state: SolverState = { nodes: 0, nodeLimit: Infinity };
  _solve(grid, 0, puzzle, cellCageMap, rowUsed, colUsed, solutions, limit, state);
  return solutions.length;
}

/**
 * Cage-only recursive backtracking -- NO row/col uniqueness.
 * This is what the player actually experiences: only cage arithmetic matters.
 */
function _solveCageOnly(
  grid: number[],
  pos: number,
  puzzle: Puzzle,
  cellCageMap: number[],
  solutions: number[][],
  stopAt: number,
  state: SolverState,
): void {
  if (solutions.length >= stopAt) return;
  if (++state.nodes > state.nodeLimit) return;

  const { size } = puzzle;
  const total = size * size;

  while (pos < total && grid[pos] !== 0) pos++;

  if (pos === total) {
    for (const cage of puzzle.cages) {
      if (checkCage(cage, grid) !== 'satisfied') return;
    }
    solutions.push(grid.slice());
    return;
  }

  const cageIdx = cellCageMap[pos];
  const cage = puzzle.cages[cageIdx];

  for (let val = 1; val <= size; val++) {
    grid[pos] = val;

    if (checkCageTight(cage, grid, size) !== 'impossible') {
      _solveCageOnly(grid, pos + 1, puzzle, cellCageMap, solutions, stopAt, state);
      if (solutions.length >= stopAt || state.nodes > state.nodeLimit) {
        grid[pos] = 0;
        return;
      }
    }

    grid[pos] = 0;
  }
}

/**
 * Verify that a puzzle has a unique solution using ONLY cage constraints.
 * No row/col Latin-square rules -- this is the player's constraint set.
 *
 * Returns:
 *  - true   -> cage constraints alone give exactly one solution (puzzle is fair)
 *  - false  -> multiple cage-only solutions OR node limit exceeded (puzzle is unfair/unknown)
 */
export function verifyCageOnlyUnique(puzzle: Puzzle, nodeLimit: number = 2_000_000): boolean {
  const { size } = puzzle;
  const grid = new Array(size * size).fill(0);
  const cellCageMap = buildCellCageMap(puzzle);
  const solutions: number[][] = [];
  const state: SolverState = { nodes: 0, nodeLimit };
  _solveCageOnly(grid, 0, puzzle, cellCageMap, solutions, 2, state);

  // Exactly 1 solution found within budget = puzzle is fair
  return solutions.length === 1 && state.nodes <= state.nodeLimit;
}
