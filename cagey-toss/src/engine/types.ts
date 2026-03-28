/**
 * Cagey — Shared Types
 */

export type CageOp = '+' | '*';

export interface Cage {
  cells: number[];
  op: CageOp;
  target: number;
}

export interface Puzzle {
  size: number;
  cages: Cage[];
}

export interface PuzzleWithSolution extends Puzzle {
  solution: number[];
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type CageStatus = 'satisfied' | 'ok' | 'impossible';

export type CellDisplayStatus = 'correct' | 'incorrect' | 'incomplete';

export interface UndoEntry {
  idx: number;
  prev: number;
}

export interface GameState {
  puzzle: PuzzleWithSolution;
  grid: number[];
  cellCageMap: number[];
  getCageStatus: (ci: number) => CellDisplayStatus;
  getCellStatus: (idx: number) => CellDisplayStatus;
  isPuzzleComplete: () => boolean;
  setCellValue: (idx: number, value: number) => void;
  undo: () => boolean;
  getUndoDepth: () => number;
  revealHint: (cellIndex: number, value: number) => void;
}
