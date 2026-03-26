/**
 * Cagey — Backtracking Solver
 *
 * Design decision: solutions are generated as Latin squares (each value 1..N appears
 * exactly once per row and column, where N = grid size = maxVal). This constraint is
 * invisible to the player — players only see cage hints and fill numbers freely — but
 * it makes puzzle generation ~1000x faster and unique solutions achievable.
 *
 * Why hidden row/col uniqueness is fine UX:
 *  - Players solve by cage arithmetic; they rarely need to think about rows/cols
 *  - The cage constraints ALONE uniquely determine the solution (by design)
 *  - "No sudoku rules" means players don't need to use row/col deduction
 */

'use strict';

/**
 * @typedef {{ cells: number[], op: '+' | '*', target: number }} Cage
 * @typedef {{ size: number, cages: Cage[] }} Puzzle
 */

/**
 * Check whether a partially-filled cage is feasible.
 * vals: array of cell values (0 = unfilled)
 * Returns 'satisfied' | 'ok' | 'impossible'
 */
function checkCage(cage, grid) {
  const vals = cage.cells.map(i => grid[i]);
  const filled = vals.filter(v => v !== 0);
  const empty = vals.length - filled.length;

  if (cage.op === '+') {
    const sum = filled.reduce((a, b) => a + b, 0);
    if (empty === 0) return sum === cage.target ? 'satisfied' : 'impossible';
    if (sum >= cage.target) return 'impossible'; // partial sum already ≥ target
    return 'ok';
  } else { // '*'
    const prod = filled.reduce((a, b) => a * b, 1);
    if (empty === 0) return prod === cage.target ? 'satisfied' : 'impossible';
    if (cage.target % prod !== 0) return 'impossible'; // partial product doesn't divide target
    return 'ok';
  }
}

/**
 * Build cellIndex → cage index map.
 */
function buildCellCageMap(puzzle) {
  const map = new Array(puzzle.size * puzzle.size).fill(-1);
  puzzle.cages.forEach((cage, ci) => {
    cage.cells.forEach(idx => { map[idx] = ci; });
  });
  return map;
}

/**
 * Core recursive backtracking solver with row/col uniqueness pruning.
 * rowUsed[r]: bitmask of values used in row r
 * colUsed[c]: bitmask of values used in col c
 */
function _solve(grid, pos, puzzle, cellCageMap, rowUsed, colUsed, solutions, stopAt, state) {
  if (solutions.length >= stopAt) return;
  if (++state.nodes > state.nodeLimit) return; // budget exceeded

  const { size } = puzzle;
  const total = size * size;

  // Skip already-filled cells
  while (pos < total && grid[pos] !== 0) pos++;

  if (pos === total) {
    // Verify all cages are satisfied
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
 *  - number[]  → unique solution (flat row-major array)
 *  - null      → no solution
 *  - false     → multiple solutions OR node limit exceeded (treat as "retry")
 *
 * @param {Puzzle} puzzle
 * @param {number} [nodeLimit=Infinity]  abort after this many nodes (for generation use)
 * @returns {number[] | null | false}
 */
function solve(puzzle, nodeLimit = Infinity) {
  const { size } = puzzle;
  const grid = new Array(size * size).fill(0);
  const cellCageMap = buildCellCageMap(puzzle);
  const rowUsed = new Array(size).fill(0);
  const colUsed = new Array(size).fill(0);
  const solutions = [];
  const state = { nodes: 0, nodeLimit };
  _solve(grid, 0, puzzle, cellCageMap, rowUsed, colUsed, solutions, 2, state);

  if (state.nodes > state.nodeLimit) return false; // timed out → retry
  if (solutions.length === 0) return null;
  if (solutions.length === 1) return solutions[0];
  return false;
}

/**
 * Count solutions up to `limit`.
 */
function countSolutions(puzzle, limit = 2) {
  const { size } = puzzle;
  const grid = new Array(size * size).fill(0);
  const cellCageMap = buildCellCageMap(puzzle);
  const rowUsed = new Array(size).fill(0);
  const colUsed = new Array(size).fill(0);
  const solutions = [];
  const state = { nodes: 0, nodeLimit: Infinity };
  _solve(grid, 0, puzzle, cellCageMap, rowUsed, colUsed, solutions, limit, state);
  return solutions.length;
}

module.exports = { solve, countSolutions, checkCage };
