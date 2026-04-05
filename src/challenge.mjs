/**
 * Cagey — Challenge Mode (ESM)
 *
 * Generates inventory-limited puzzles. Uses existing Latin square generator,
 * then derives inventory from solution digit counts.
 *
 * Patterns (surplus-based, original solution always valid):
 *  - 'tight'  : inventory = exact count from solution (easiest, counts are hints)
 *  - 'loose'  : +1-2 random extras on some numbers (harder, adds uncertainty)
 *  - 'flood'  : +2-3 extras on all numbers (hardest, lots of uncertainty)
 *
 * Key insight: exact inventory LEAKS information (×1 means position is almost
 * determined). Adding surplus makes the puzzle harder, not easier.
 */

import { generate, mulberry32 } from './generator.mjs';

export const CHALLENGE_PATTERNS = ['tight', 'loose', 'flood'];

/**
 * Count occurrences of each value 1..size in the solution grid.
 */
export function countSolutionDigits(solution, size) {
  const counts = {};
  for (let v = 1; v <= size; v++) counts[v] = 0;
  for (const v of solution) counts[v] = (counts[v] || 0) + 1;
  return counts;
}

/**
 * Generate inventory from a puzzle solution.
 *
 * All patterns guarantee: inventory[v] >= solutionCount[v] for every v.
 * This means the original solution is always valid. Surplus adds uncertainty.
 *
 * @param {number[]} solution - flat row-major solution grid
 * @param {number} size - grid dimension (4, 5, 6, 8)
 * @param {function} rng - seeded PRNG
 * @param {'tight'|'loose'|'flood'} pattern
 * @returns {Object<number, number>} inventory map { 1: N, 2: M, ... }
 */
export function generateInventory(solution, size, rng, pattern = 'tight') {
  const counts = countSolutionDigits(solution, size);
  const inventory = { ...counts };

  if (pattern === 'tight') {
    // Exact counts. Easiest because inventory IS the solution's fingerprint.
    return inventory;
  }

  if (pattern === 'loose') {
    // Add +1 or +2 extras to 2-3 random numbers
    const candidates = Array.from({ length: size }, (_, i) => i + 1);
    const numExtras = Math.min(size, 2 + Math.floor(rng() * 2)); // 2-3 numbers get extras
    for (let i = 0; i < numExtras; i++) {
      const idx = Math.floor(rng() * candidates.length);
      const v = candidates[idx];
      inventory[v] += 1 + Math.floor(rng() * 2); // +1 or +2
    }
  } else if (pattern === 'flood') {
    // Add +2 or +3 to every number
    for (let v = 1; v <= size; v++) {
      inventory[v] += 2 + Math.floor(rng() * 2); // +2 or +3
    }
  }

  return inventory;
}

/**
 * Generate a Challenge mode puzzle.
 *
 * @param {'easy'|'medium'|'hard'|'expert'} difficulty
 * @param {number} [seed]
 * @param {'tight'|'loose'|'flood'} [pattern='tight']
 * @returns {{ size, cages, solution, inventory, pattern, gameMode } | null}
 */
export function generateChallenge(difficulty, seed, pattern = 'tight') {
  const puzzle = generate(difficulty, seed);
  if (!puzzle) return null;

  const rng = mulberry32((seed || 0) ^ 0xDEADBEEF);
  const inventory = generateInventory(puzzle.solution, puzzle.size, rng, pattern);

  return {
    ...puzzle,
    inventory,
    pattern,
    gameMode: 'challenge',
  };
}

/**
 * Check if placing a value would exceed inventory.
 */
export function canPlaceValue(value, inventoryUsed, inventory) {
  if (value === 0) return true;
  const used = inventoryUsed[value] || 0;
  const available = inventory[value] || 0;
  return used < available;
}

/**
 * Get remaining count for each value.
 */
export function getRemainingInventory(inventoryUsed, inventory, size) {
  const remaining = {};
  for (let v = 1; v <= size; v++) {
    remaining[v] = (inventory[v] || 0) - (inventoryUsed[v] || 0);
  }
  return remaining;
}
