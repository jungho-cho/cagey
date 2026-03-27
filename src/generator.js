/**
 * Cagey — Puzzle Generator
 *
 * Generates cage puzzles with guaranteed unique solutions.
 *
 * Key design: solutions are Latin squares (each value 1..N appears once per row
 * and column). This makes unique solutions achievable and solver fast.
 * maxVal = size for all difficulties.
 *
 * Algorithm:
 *  1. Generate a random Latin square solution (Fisher-Yates + row shuffle)
 *  2. Partition cells into cages via flood-fill (2-4 cells each)
 *  3. Assign +/* operation per cage; compute target from solution
 *  4. Verify unique solution via backtracking solver
 *  5. Retry up to MAX_RETRIES if not unique
 */

'use strict';

const { solve } = require('./solver');

// mulberry32 — seedable PRNG used for deterministic daily challenges
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function randInt(rng, min, max) { return min + Math.floor(rng() * (max - min + 1)); }

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const DIFFICULTY = {
  easy:   { size: 4, ops: ['+'],       cageMin: 2, cageMax: 3 },
  medium: { size: 5, ops: ['+', '*'],  cageMin: 2, cageMax: 3 },
  hard:   { size: 6, ops: ['+', '*'],  cageMin: 2, cageMax: 4 },
  expert: { size: 8, ops: ['+', '*'],  cageMin: 2, cageMax: 4 },
};

const MAX_RETRIES = 80;
const BUDGET_MS = 2500; // total time budget per generate() call

/**
 * Generate a random Latin square (each value 1..N exactly once per row and column).
 * Uses a simple but effective approach: start with a cyclic shift base, then
 * shuffle rows and columns.
 */
function generateLatinSquare(size, rng) {
  // Base: row[r][c] = ((r + c) % size) + 1
  const grid = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      row.push(((r + c) % size) + 1);
    }
    grid.push(row);
  }

  // Shuffle rows
  shuffle(grid, rng);

  // Shuffle columns by the same permutation for each row
  const colPerm = shuffle(Array.from({ length: size }, (_, i) => i), rng);
  for (let r = 0; r < size; r++) {
    const original = grid[r].slice();
    for (let c = 0; c < size; c++) {
      grid[r][c] = original[colPerm[c]];
    }
  }

  // Apply a random value permutation (relabel 1..N → permuted 1..N)
  const valPerm = shuffle(Array.from({ length: size }, (_, i) => i + 1), rng);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      grid[r][c] = valPerm[grid[r][c] - 1];
    }
  }

  // Flatten to row-major 1D array
  return grid.flat();
}

/**
 * Partition all cells into cages using flood-fill.
 * Returns array of cell-index arrays.
 */
function partitionIntoCages(size, cageMin, cageMax, rng) {
  const total = size * size;
  const assigned = new Array(total).fill(false);
  const cages = [];
  const order = shuffle(Array.from({ length: total }, (_, i) => i), rng);

  for (const start of order) {
    if (assigned[start]) continue;

    const targetSize = randInt(rng, cageMin, cageMax);
    const cage = [start];
    assigned[start] = true;
    const frontier = [start];

    while (cage.length < targetSize && frontier.length > 0) {
      const fi = Math.floor(rng() * frontier.length);
      const cell = frontier[fi];
      frontier.splice(fi, 1);

      const r = (cell / size) | 0;
      const c = cell % size;
      const neighbors = [];
      if (r > 0)        neighbors.push(cell - size);
      if (r < size - 1) neighbors.push(cell + size);
      if (c > 0)        neighbors.push(cell - 1);
      if (c < size - 1) neighbors.push(cell + 1);

      // Shuffle neighbors so cage shapes are varied
      shuffle(neighbors, rng);
      for (const n of neighbors) {
        if (!assigned[n] && cage.length < targetSize) {
          assigned[n] = true;
          cage.push(n);
          frontier.push(n);
        }
      }
    }

    cages.push(cage);
  }

  // Merge any singleton cage into an adjacent cage (singletons are trivial / boring)
  for (let ci = cages.length - 1; ci >= 0; ci--) {
    if (cages[ci].length >= cageMin) continue;
    const cellIdx = cages[ci][0];
    const r = (cellIdx / size) | 0, c = cellIdx % size;
    const neighbors = [];
    if (r > 0)        neighbors.push(cellIdx - size);
    if (r < size - 1) neighbors.push(cellIdx + size);
    if (c > 0)        neighbors.push(cellIdx - 1);
    if (c < size - 1) neighbors.push(cellIdx + 1);
    // Find which cage a neighbor belongs to
    let merged = false;
    for (const n of neighbors) {
      const targetCageIdx = cages.findIndex(cg => cg.includes(n));
      if (targetCageIdx >= 0 && targetCageIdx !== ci && cages[targetCageIdx].length < cageMax) {
        cages[targetCageIdx].push(...cages[ci]);
        cages.splice(ci, 1);
        merged = true;
        break;
      }
    }
    if (!merged) {
      // Force merge with ANY neighbor cage regardless of size
      for (const n of neighbors) {
        const targetCageIdx = cages.findIndex(cg => cg.includes(n));
        if (targetCageIdx >= 0 && targetCageIdx !== ci) {
          cages[targetCageIdx].push(...cages[ci]);
          cages.splice(ci, 1);
          break;
        }
      }
    }
  }

  return cages;
}

/**
 * Pick operation for a cage. Prefer '*' only when product is not too large.
 */
function chooseCageOp(cells, solution, ops, rng) {
  if (ops.length === 1) return ops[0];
  const vals = cells.map(i => solution[i]);
  const product = vals.reduce((a, b) => a * b, 1);
  // Avoid unwieldy targets; cap at 500 for readability
  if (product > 500) return '+';
  return rng() < 0.4 ? '*' : '+';
}

/**
 * Build cage objects from cell groups + solution.
 */
function buildCages(cellGroups, solution, ops, rng) {
  return cellGroups.map(cells => {
    const op = chooseCageOp(cells, solution, ops, rng);
    const vals = cells.map(i => solution[i]);
    const target = op === '+'
      ? vals.reduce((a, b) => a + b, 0)
      : vals.reduce((a, b) => a * b, 1);
    return { cells, op, target };
  });
}

/**
 * Generate a Cagey puzzle.
 *
 * @param {'easy'|'medium'|'hard'|'expert'} difficulty
 * @param {number} [seed]  — omit for random; same seed → same puzzle
 * @returns {{ size: number, cages: Cage[], solution: number[] } | null}
 *   Returns null only if MAX_RETRIES exhausted (use bundled fallback).
 */
function generate(difficulty, seed, budgetMs) {
  const cfg = DIFFICULTY[difficulty];
  if (!cfg) throw new Error(`Unknown difficulty: ${difficulty}`);

  const baseSeed = seed !== undefined ? seed : (Math.random() * 0xFFFFFFFF) >>> 0;
  const deadline = Date.now() + (budgetMs !== undefined ? budgetMs : BUDGET_MS);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (Date.now() > deadline) break; // time budget exceeded

    const rng = mulberry32(baseSeed ^ (attempt * 2654435761));

    const solution = generateLatinSquare(cfg.size, rng);
    const cellGroups = partitionIntoCages(cfg.size, cfg.cageMin, cfg.cageMax, rng);
    const cages = buildCages(cellGroups, solution, cfg.ops, rng);
    const puzzle = { size: cfg.size, cages };

    // Latin-square uniqueness check (fast). The player's game completion
    // uses cage arithmetic only, so multiple cage-valid solutions may exist.
    // Hints use solveCageOnly to stay compatible with the player's current grid.
    const NODE_LIMIT = 500_000;
    const result = solve(puzzle, NODE_LIMIT);
    if (result !== null && result !== false) {
      return { ...puzzle, solution };
    }
  }

  return null; // fallback to bundled puzzles
}

module.exports = { generate, mulberry32, DIFFICULTY };
