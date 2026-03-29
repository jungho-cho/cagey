/**
 * Cagey — Shared Types
 */

export type CageOp = '+' | '*' | '-' | '/';

export interface DifficultyConfig {
  size: number;
  ops: CageOp[];
  cageMin: number;
  cageMax: number;
  rowUnique: boolean;
  colUnique: boolean;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { size: 4, ops: ['+'], cageMin: 2, cageMax: 3, rowUnique: false, colUnique: false },
  medium: { size: 5, ops: ['+', '*'], cageMin: 2, cageMax: 3, rowUnique: true, colUnique: false },
  hard: { size: 6, ops: ['+', '*', '-', '/'], cageMin: 2, cageMax: 4, rowUnique: true, colUnique: true },
  expert: { size: 8, ops: ['+', '*', '-', '/'], cageMin: 2, cageMax: 4, rowUnique: true, colUnique: true },
};

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

export interface RowColViolation {
  row: number;
  col: number;
  value: number;
}

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
  isPuzzleComplete: (options?: { rowUnique?: boolean; colUnique?: boolean }) => boolean;
  checkRowUniqueness: (row: number) => boolean;
  checkColUniqueness: (col: number) => boolean;
  getRowColViolations: () => RowColViolation[];
  setCellValue: (idx: number, value: number) => void;
  undo: () => boolean;
  getUndoDepth: () => number;
  revealHint: (cellIndex: number, value: number) => void;
}
