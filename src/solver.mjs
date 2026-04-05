/**
 * Cagey — Backtracking Solver (ESM)
 *
 * Two solvers:
 *  1. Latin-square solver (fast) — used during generation for quick uniqueness check
 *  2. Cage-only solver (slower) — verifies that cage constraints ALONE uniquely
 *     determine the solution, with NO hidden row/col rules.
 */

function checkCage(cage, grid) {
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
  } else { // '/'
    if (vals.length !== 2) return 'impossible';
    if (empty === 0) {
      const mx = Math.max(filled[0], filled[1]);
      const mn = Math.min(filled[0], filled[1]);
      return (mn !== 0 && mx / mn === cage.target && mx % mn === 0) ? 'satisfied' : 'impossible';
    }
    return 'ok';
  }
}

function buildCellCageMap(puzzle) {
  const map = new Array(puzzle.size * puzzle.size).fill(-1);
  puzzle.cages.forEach((cage, ci) => {
    cage.cells.forEach(idx => { map[idx] = ci; });
  });
  return map;
}

function _solve(grid, pos, puzzle, cellCageMap, rowUsed, colUsed, solutions, stopAt, state) {
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

  const row = (pos / size) | 0;
  const col = pos % size;
  const cage = puzzle.cages[cellCageMap[pos]];

  for (let val = 1; val <= size; val++) {
    const bit = 1 << val;
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

export function solve(puzzle, nodeLimit = Infinity) {
  if (puzzle.size > 30) throw new Error(`Grid size ${puzzle.size} exceeds bitmask capacity (max 30)`);
  const { size } = puzzle;
  const grid = new Array(size * size).fill(0);
  const cellCageMap = buildCellCageMap(puzzle);
  const rowUsed = new Array(size).fill(0);
  const colUsed = new Array(size).fill(0);
  const solutions = [];
  const state = { nodes: 0, nodeLimit };
  _solve(grid, 0, puzzle, cellCageMap, rowUsed, colUsed, solutions, 2, state);

  if (state.nodes > state.nodeLimit) return false;
  if (solutions.length === 0) return null;
  if (solutions.length === 1) return solutions[0];
  return false;
}

export function countSolutions(puzzle, limit = 2) {
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

function checkCageTight(cage, grid, maxVal) {
  const vals = cage.cells.map(i => grid[i]);
  const filled = vals.filter(v => v !== 0);
  const empty = vals.length - filled.length;

  if (cage.op === '+') {
    const sum = filled.reduce((a, b) => a + b, 0);
    if (empty === 0) return sum === cage.target ? 'satisfied' : 'impossible';
    if (sum >= cage.target) return 'impossible';
    if (sum + empty > cage.target) return 'impossible';
    if (sum + empty * maxVal < cage.target) return 'impossible';
    return 'ok';
  } else if (cage.op === '*') {
    const prod = filled.reduce((a, b) => a * b, 1);
    if (empty === 0) return prod === cage.target ? 'satisfied' : 'impossible';
    if (cage.target % prod !== 0) return 'impossible';
    if (prod * Math.pow(maxVal, empty) < cage.target) return 'impossible';
    if (prod > cage.target) return 'impossible';
    return 'ok';
  } else if (cage.op === '-') {
    if (vals.length !== 2) return 'impossible';
    if (empty === 0) return Math.abs(filled[0] - filled[1]) === cage.target ? 'satisfied' : 'impossible';
    if (filled.length === 1) {
      const v = filled[0];
      if (v + cage.target > maxVal && v - cage.target < 1) return 'impossible';
    }
    return 'ok';
  } else { // '/'
    if (vals.length !== 2) return 'impossible';
    if (empty === 0) {
      const mx = Math.max(filled[0], filled[1]);
      const mn = Math.min(filled[0], filled[1]);
      return (mn !== 0 && mx / mn === cage.target && mx % mn === 0) ? 'satisfied' : 'impossible';
    }
    if (filled.length === 1) {
      const v = filled[0];
      const canDivide = cage.target !== 0 && v % cage.target === 0 && v / cage.target >= 1 && v / cage.target <= maxVal;
      const canMultiply = v * cage.target <= maxVal;
      if (!canDivide && !canMultiply) return 'impossible';
    }
    return 'ok';
  }
}

function _solveCageOnly(grid, pos, puzzle, cellCageMap, solutions, stopAt, state) {
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

  const cage = puzzle.cages[cellCageMap[pos]];

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

export function verifyCageOnlyUnique(puzzle, nodeLimit = 2_000_000) {
  const { size } = puzzle;
  const grid = new Array(size * size).fill(0);
  const cellCageMap = buildCellCageMap(puzzle);
  const solutions = [];
  const state = { nodes: 0, nodeLimit };
  _solveCageOnly(grid, 0, puzzle, cellCageMap, solutions, 2, state);
  return solutions.length === 1 && state.nodes <= state.nodeLimit;
}

// Re-export internals needed by game (hints use cage-only solver)
export { checkCage, buildCellCageMap, checkCageTight, _solveCageOnly };
