/**
 * Cagey -- Game State + Undo Stack
 *
 * React-friendly pattern: plain object factory (not a class).
 * Import checkCage from solver.ts for DRY cage evaluation.
 */

import { checkCage } from './solver';
import type { CellDisplayStatus, GameState, PuzzleWithSolution, RowColViolation, UndoEntry } from './types';

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

  function checkRowUniqueness(row: number): boolean {
    const seen = new Set<number>();
    for (let c = 0; c < size; c++) {
      const v = grid[row * size + c];
      if (v === 0) continue;
      if (seen.has(v)) return false;
      seen.add(v);
    }
    return true;
  }

  function checkColUniqueness(col: number): boolean {
    const seen = new Set<number>();
    for (let r = 0; r < size; r++) {
      const v = grid[r * size + col];
      if (v === 0) continue;
      if (seen.has(v)) return false;
      seen.add(v);
    }
    return true;
  }

  function getRowColViolations(): RowColViolation[] {
    const violations: RowColViolation[] = [];
    // Check rows
    for (let r = 0; r < size; r++) {
      const counts = new Map<number, number[]>();
      for (let c = 0; c < size; c++) {
        const v = grid[r * size + c];
        if (v === 0) continue;
        if (!counts.has(v)) counts.set(v, []);
        counts.get(v)!.push(c);
      }
      for (const [val, cols] of counts) {
        if (cols.length > 1) {
          for (const c of cols) {
            violations.push({ row: r, col: c, value: val });
          }
        }
      }
    }
    // Check columns
    for (let c = 0; c < size; c++) {
      const counts = new Map<number, number[]>();
      for (let r = 0; r < size; r++) {
        const v = grid[r * size + c];
        if (v === 0) continue;
        if (!counts.has(v)) counts.set(v, []);
        counts.get(v)!.push(r);
      }
      for (const [val, rows] of counts) {
        if (rows.length > 1) {
          for (const r of rows) {
            // Avoid duplicates if already added from row check
            if (!violations.some(v => v.row === r && v.col === c && v.value === val)) {
              violations.push({ row: r, col: c, value: val });
            }
          }
        }
      }
    }
    return violations;
  }

  function isPuzzleComplete(options?: { rowUnique?: boolean; colUnique?: boolean }): boolean {
    const allCagesCorrect = cages.every((_, ci) => getCageStatus(ci) === 'correct');
    if (!allCagesCorrect) return false;
    if (options?.rowUnique) {
      for (let r = 0; r < size; r++) {
        if (!checkRowUniqueness(r)) return false;
      }
    }
    if (options?.colUnique) {
      for (let c = 0; c < size; c++) {
        if (!checkColUniqueness(c)) return false;
      }
    }
    return true;
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
    checkRowUniqueness,
    checkColUniqueness,
    getRowColViolations,
    setCellValue,
    undo,
    getUndoDepth: () => undoStack.length,
    revealHint,
  };
}
