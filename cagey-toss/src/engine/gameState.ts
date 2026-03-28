/**
 * Cagey -- Game State + Undo Stack
 *
 * React-friendly pattern: plain object factory (not a class).
 * Import checkCage from solver.ts for DRY cage evaluation.
 */

import { checkCage } from './solver';
import type { CellDisplayStatus, GameState, PuzzleWithSolution, UndoEntry } from './types';

const UNDO_LIMIT = 50;

export function createGameState(puzzle: PuzzleWithSolution): GameState {
  const { size, cages } = puzzle;
  const total = size * size;

  // Build cellIndex -> cage index map
  const cellCageMap = new Array(total).fill(-1);
  cages.forEach((cage, ci) => {
    cage.cells.forEach(idx => {
      cellCageMap[idx] = ci;
    });
  });

  const grid = new Array(total).fill(0);
  const undoStack: UndoEntry[] = [];

  function getCageStatus(ci: number): CellDisplayStatus {
    const cage = cages[ci];
    const vals = cage.cells.map(i => grid[i]);
    if (vals.some(v => v === 0)) return 'incomplete';
    const result = checkCage(cage, grid);
    return result === 'satisfied' ? 'correct' : 'incorrect';
  }

  function getCellStatus(idx: number): CellDisplayStatus {
    const ci = cellCageMap[idx];
    if (ci < 0) return 'incomplete';
    return getCageStatus(ci);
  }

  function isPuzzleComplete(): boolean {
    return cages.every((_, ci) => getCageStatus(ci) === 'correct');
  }

  function setCellValue(idx: number, value: number): void {
    const prev = grid[idx];
    if (prev === value) return;
    undoStack.push({ idx, prev });
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
    grid[idx] = value;
  }

  function undo(): boolean {
    if (undoStack.length === 0) return false;
    const entry = undoStack.pop()!;
    grid[entry.idx] = entry.prev;
    return true;
  }

  function revealHint(cellIndex: number, value: number): void {
    // Hints are permanent -- set value without pushing to undo stack
    grid[cellIndex] = value;
  }

  return {
    puzzle,
    grid,
    cellCageMap,
    getCageStatus,
    getCellStatus,
    isPuzzleComplete,
    setCellValue,
    undo,
    getUndoDepth: () => undoStack.length,
    revealHint,
  };
}
