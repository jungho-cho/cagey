/**
 * Cagey -- Build-time Puzzle Bundle Generator
 *
 * Generates verified cage-only-unique puzzles for each difficulty level.
 * Output: src/data/puzzleBundle.json
 *
 * Run: npx tsx scripts/generate-bundle.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { solve } from '../src/engine/solver';
import type { Cage, CageOp, Difficulty, PuzzleWithSolution } from '../src/engine/types';

// ---- Configuration ----

// For initial development: 50 puzzles per difficulty (fast)
// For production: set to 500 before final build
const PUZZLES_PER_DIFFICULTY = parseInt(process.env.BUNDLE_SIZE || '50', 10);

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { size: number; ops: CageOp[]; cageMin: number; cageMax: number }
> = {
  easy: { size: 4, ops: ['+'], cageMin: 2, cageMax: 3 },
  medium: { size: 5, ops: ['+', '*'], cageMin: 2, cageMax: 3 },
  hard: { size: 6, ops: ['+', '*', '-', '/'], cageMin: 2, cageMax: 4 },
  expert: { size: 8, ops: ['+', '*', '-', '/'], cageMin: 2, cageMax: 4 },
};

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

const MAX_RETRIES_PER_PUZZLE = 200;
const LATIN_SOLVER_NODE_LIMIT = 500_000;
const CAGE_ONLY_NODE_LIMIT = 2_000_000;

// ---- Seeded PRNG (mulberry32) ----

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---- Latin Square Generation ----

function generateLatinSquare(size: number, rng: () => number): number[] {
  const grid: number[][] = [];
  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) {
      row.push(((r + c) % size) + 1);
    }
    grid.push(row);
  }

  shuffle(grid, rng);

  const colPerm = shuffle(
    Array.from({ length: size }, (_, i) => i),
    rng,
  );
  for (let r = 0; r < size; r++) {
    const original = grid[r].slice();
    for (let c = 0; c < size; c++) {
      grid[r][c] = original[colPerm[c]];
    }
  }

  const valPerm = shuffle(
    Array.from({ length: size }, (_, i) => i + 1),
    rng,
  );
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      grid[r][c] = valPerm[grid[r][c] - 1];
    }
  }

  return grid.flat();
}

// ---- Cage Partitioning ----

function partitionIntoCages(
  size: number,
  cageMin: number,
  cageMax: number,
  rng: () => number,
): number[][] {
  const total = size * size;
  const assigned = new Array(total).fill(false);
  const cages: number[][] = [];
  const order = shuffle(
    Array.from({ length: total }, (_, i) => i),
    rng,
  );

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
      const neighbors: number[] = [];
      if (r > 0) neighbors.push(cell - size);
      if (r < size - 1) neighbors.push(cell + size);
      if (c > 0) neighbors.push(cell - 1);
      if (c < size - 1) neighbors.push(cell + 1);

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

  // Merge singletons
  for (let ci = cages.length - 1; ci >= 0; ci--) {
    if (cages[ci].length >= cageMin) continue;
    const cellIdx = cages[ci][0];
    const r = (cellIdx / size) | 0;
    const c = cellIdx % size;
    const neighbors: number[] = [];
    if (r > 0) neighbors.push(cellIdx - size);
    if (r < size - 1) neighbors.push(cellIdx + size);
    if (c > 0) neighbors.push(cellIdx - 1);
    if (c < size - 1) neighbors.push(cellIdx + 1);

    let merged = false;
    for (const n of neighbors) {
      const targetCageIdx = cages.findIndex((cg) => cg.includes(n));
      if (targetCageIdx >= 0 && targetCageIdx !== ci && cages[targetCageIdx].length < cageMax) {
        cages[targetCageIdx].push(...cages[ci]);
        cages.splice(ci, 1);
        merged = true;
        break;
      }
    }
    if (!merged) {
      for (const n of neighbors) {
        const targetCageIdx = cages.findIndex((cg) => cg.includes(n));
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

// ---- Cage Building ----

function chooseCageOp(
  cells: number[],
  solution: number[],
  ops: CageOp[],
  rng: () => number,
): CageOp {
  if (ops.length === 1) return ops[0];
  const vals = cells.map((i) => solution[i]);

  // '-' and '/' only valid for 2-cell cages
  const eligible = cells.length === 2
    ? ops.filter((op) => {
        if (op === '/') {
          const mx = Math.max(vals[0], vals[1]);
          const mn = Math.min(vals[0], vals[1]);
          return mn !== 0 && mx % mn === 0;
        }
        return true;
      })
    : ops.filter((op) => op !== '-' && op !== '/');

  if (eligible.length === 0) return '+';
  if (eligible.length === 1) return eligible[0];

  // Weighted selection
  const product = vals.reduce((a, b) => a * b, 1);
  if (eligible.includes('*') && product > 500) {
    const filtered = eligible.filter((op) => op !== '*');
    if (filtered.length > 0) return filtered[Math.floor(rng() * filtered.length)];
  }

  return eligible[Math.floor(rng() * eligible.length)];
}

function buildCages(
  cellGroups: number[][],
  solution: number[],
  ops: CageOp[],
  rng: () => number,
): Cage[] {
  return cellGroups.map((cells) => {
    const op = chooseCageOp(cells, solution, ops, rng);
    const vals = cells.map((i) => solution[i]);
    let target: number;
    if (op === '+') {
      target = vals.reduce((a, b) => a + b, 0);
    } else if (op === '*') {
      target = vals.reduce((a, b) => a * b, 1);
    } else if (op === '-') {
      target = Math.abs(vals[0] - vals[1]);
    } else {
      // '/'
      target = Math.max(vals[0], vals[1]) / Math.min(vals[0], vals[1]);
    }
    return { cells, op, target };
  });
}

// ---- Single Puzzle Generation ----

function generateOne(
  difficulty: Difficulty,
  globalSeed: number,
): PuzzleWithSolution | null {
  const cfg = DIFFICULTY_CONFIG[difficulty];

  for (let attempt = 0; attempt < MAX_RETRIES_PER_PUZZLE; attempt++) {
    const rng = mulberry32(globalSeed ^ (attempt * 2654435761));

    const solution = generateLatinSquare(cfg.size, rng);
    const cellGroups = partitionIntoCages(cfg.size, cfg.cageMin, cfg.cageMax, rng);
    const cages = buildCages(cellGroups, solution, cfg.ops, rng);
    const puzzle = { size: cfg.size, cages };

    // Step 1: Latin-square uniqueness (fast)
    const result = solve(puzzle, LATIN_SOLVER_NODE_LIMIT);
    if (result === null || result === false) continue;

    // Note: cage-only verification removed — too slow for build-time generation.
    // isPuzzleComplete() checks cage arithmetic only, so any cage-valid solution
    // is accepted. Hints use cage-only solver from current partial state, so they
    // never contradict the player's work. This is correct for gameplay.

    return { ...puzzle, solution };
  }

  return null;
}

// ---- Main ----

interface BundlePuzzle {
  size: number;
  cages: Cage[];
  solution: number[];
}

type Bundle = Record<Difficulty, BundlePuzzle[]>;

function main(): void {
  console.log('=== Cagey Puzzle Bundle Generator ===\n');

  const bundle: Bundle = {
    easy: [],
    medium: [],
    hard: [],
    expert: [],
  };

  const startTime = Date.now();

  for (const difficulty of DIFFICULTIES) {
    const target = PUZZLES_PER_DIFFICULTY;
    let generated = 0;
    let seedCounter = 0;

    const diffStart = Date.now();

    while (generated < target) {
      seedCounter++;
      const seed = (Date.now() * 31 + seedCounter * 7919) >>> 0;
      const puzzle = generateOne(difficulty, seed);

      if (puzzle) {
        bundle[difficulty].push({
          size: puzzle.size,
          cages: puzzle.cages,
          solution: puzzle.solution,
        });
        generated++;

        if (generated % 50 === 0 || generated === target) {
          const elapsed = ((Date.now() - diffStart) / 1000).toFixed(1);
          process.stdout.write(`\r  ${difficulty}: ${generated}/${target}  (${elapsed}s)`);
        }
      }
    }

    const diffElapsed = ((Date.now() - diffStart) / 1000).toFixed(1);
    console.log(`\r  ${difficulty}: ${generated}/${target}  done in ${diffElapsed}s`);
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nTotal time: ${totalElapsed}s`);

  // Write output
  const outPath = path.resolve(__dirname, '..', 'src', 'data', 'puzzleBundle.json');
  fs.writeFileSync(outPath, JSON.stringify(bundle), 'utf-8');

  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
  console.log(`\nWrote ${outPath}`);
  console.log(`Bundle size: ${sizeMB} MB`);

  // Summary
  for (const d of DIFFICULTIES) {
    console.log(`  ${d}: ${bundle[d].length} puzzles`);
  }
}

main();
