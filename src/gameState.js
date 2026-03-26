/**
 * Cagey — Game State + Undo Stack
 */

'use strict';

const UNDO_LIMIT = 50;

function createGameState(puzzle) {
  const { size, cages, solution } = puzzle;
  const total = size * size;

  // Build cellIndex → cage index map
  const cellCageMap = new Array(total).fill(-1);
  cages.forEach((cage, ci) => {
    cage.cells.forEach(idx => { cellCageMap[idx] = ci; });
  });

  const grid = new Array(total).fill(0);
  const undoStack = [];

  function getCageStatus(ci) {
    const cage = cages[ci];
    const vals = cage.cells.map(i => grid[i]);
    if (vals.some(v => v === 0)) return 'incomplete';
    const result = cage.op === '+'
      ? vals.reduce((a, b) => a + b, 0)
      : vals.reduce((a, b) => a * b, 1);
    return result === cage.target ? 'correct' : 'incorrect';
  }

  function getCellStatus(idx) {
    const ci = cellCageMap[idx];
    if (ci < 0) return 'incomplete';
    return getCageStatus(ci);
  }

  function isPuzzleComplete() {
    return cages.every((_, ci) => getCageStatus(ci) === 'correct');
  }

  function setCellValue(idx, value) {
    const prev = grid[idx];
    if (prev === value) return;
    undoStack.push({ idx, prev });
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
    grid[idx] = value;
  }

  function undo() {
    if (undoStack.length === 0) return false;
    const { idx, prev } = undoStack.pop();
    grid[idx] = prev;
    return true;
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
  };
}

module.exports = { createGameState };
