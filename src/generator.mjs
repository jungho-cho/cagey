/**
 * Cagey — Puzzle Generator (ESM)
 *
 * Generates cage puzzles with guaranteed unique solutions.
 * Solutions are Latin squares (each value 1..N once per row and column).
 */

import { solve } from './solver.mjs';

export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const DIFFICULTY = {
  easy:   { size: 4, ops: ['+'],                   cageMin: 2, cageMax: 3, label: 'Easy',   gridLabel: '4\u00D74', rowUnique: false, colUnique: false },
  medium: { size: 5, ops: ['+', '*'],              cageMin: 2, cageMax: 3, label: 'Medium', gridLabel: '5\u00D75', rowUnique: true,  colUnique: false },
  hard:   { size: 6, ops: ['+', '*', '-', '/'],    cageMin: 2, cageMax: 4, label: 'Hard',   gridLabel: '6\u00D76', rowUnique: true,  colUnique: true },
  expert: { size: 8, ops: ['+', '*', '-', '/'],    cageMin: 2, cageMax: 4, label: 'Expert', gridLabel: '8\u00D78', rowUnique: true,  colUnique: true },
};

const MAX_RETRIES = 80;
const BUDGET_MS = 2500;

export function generateLatinSquare(size, rng) {
  const grid = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) row.push(((r + c) % size) + 1);
    grid.push(row);
  }
  shuffle(grid, rng);
  const colPerm = shuffle(Array.from({ length: size }, (_, i) => i), rng);
  for (let r = 0; r < size; r++) {
    const orig = grid[r].slice();
    for (let c = 0; c < size; c++) grid[r][c] = orig[colPerm[c]];
  }
  const valPerm = shuffle(Array.from({ length: size }, (_, i) => i + 1), rng);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) grid[r][c] = valPerm[grid[r][c] - 1];
  return grid.flat();
}

export function partitionIntoCages(size, cageMin, cageMax, rng) {
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
      const fi = (rng() * frontier.length) | 0;
      const cell = frontier[fi]; frontier.splice(fi, 1);
      const r = (cell / size) | 0, c = cell % size;
      const neighbors = [];
      if (r > 0)        neighbors.push(cell - size);
      if (r < size - 1) neighbors.push(cell + size);
      if (c > 0)        neighbors.push(cell - 1);
      if (c < size - 1) neighbors.push(cell + 1);
      shuffle(neighbors, rng);
      for (const n of neighbors) {
        if (!assigned[n] && cage.length < targetSize) {
          assigned[n] = true; cage.push(n); frontier.push(n);
        }
      }
    }
    cages.push(cage);
  }
  for (let ci = cages.length - 1; ci >= 0; ci--) {
    if (cages[ci].length >= cageMin) continue;
    const cellIdx = cages[ci][0];
    const r = (cellIdx / size) | 0, c = cellIdx % size;
    const neighbors = [];
    if (r > 0)        neighbors.push(cellIdx - size);
    if (r < size - 1) neighbors.push(cellIdx + size);
    if (c > 0)        neighbors.push(cellIdx - 1);
    if (c < size - 1) neighbors.push(cellIdx + 1);
    let merged = false;
    for (const pass of [false, true]) {
      for (const n of neighbors) {
        const ti = cages.findIndex(cg => cg.includes(n));
        if (ti >= 0 && ti !== ci && (pass || cages[ti].length < cageMax)) {
          cages[ti].push(...cages[ci]);
          cages.splice(ci, 1);
          merged = true; break;
        }
      }
      if (merged) break;
    }
  }
  return cages;
}

export function generate(difficulty, seed, budgetMs) {
  const cfg = DIFFICULTY[difficulty];
  if (!cfg) throw new Error(`Unknown difficulty: ${difficulty}`);

  const baseSeed = seed !== undefined ? seed : (Math.random() * 0xFFFFFFFF) >>> 0;
  const deadline = Date.now() + (budgetMs !== undefined ? budgetMs : BUDGET_MS);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (Date.now() > deadline) break;
    const rng = mulberry32(baseSeed ^ (attempt * 2654435761));
    const solution = generateLatinSquare(cfg.size, rng);
    const cellGroups = partitionIntoCages(cfg.size, cfg.cageMin, cfg.cageMax, rng);
    const cages = cellGroups.map(cells => {
      const vals = cells.map(i => solution[i]);
      let eligible = cells.length === 2
        ? cfg.ops.filter(op => {
            if (op === '/') { const mx = Math.max(vals[0], vals[1]); const mn = Math.min(vals[0], vals[1]); return mn !== 0 && mx % mn === 0; }
            return true;
          })
        : cfg.ops.filter(op => op !== '-' && op !== '/');
      if (eligible.length === 0) eligible = ['+'];
      const prod = vals.reduce((a, b) => a * b, 1);
      if (eligible.includes('*') && prod > 500) eligible = eligible.filter(op => op !== '*');
      if (eligible.length === 0) eligible = ['+'];
      const op = eligible[Math.floor(rng() * eligible.length)];
      let target;
      if (op === '+') target = vals.reduce((a, b) => a + b, 0);
      else if (op === '*') target = vals.reduce((a, b) => a * b, 1);
      else if (op === '-') target = Math.abs(vals[0] - vals[1]);
      else target = Math.max(vals[0], vals[1]) / Math.min(vals[0], vals[1]);
      return { cells, op, target };
    });
    const puzzle = { size: cfg.size, cages };
    const result = solve(puzzle, 500_000);
    if (result !== null && result !== false) return { ...puzzle, solution };
  }
  return null;
}
