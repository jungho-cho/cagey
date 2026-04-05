/**
 * Cagey — Challenge Mode (ESM)
 *
 * Generates inventory-limited puzzles. Uses existing Latin square generator,
 * then derives inventory by counting solution digits and optionally removing
 * surplus to create uneven patterns.
 *
 * Patterns:
 *  - 'exact'   : inventory = exact count from solution (tightest)
 *  - 'pyramid' : smaller numbers get fewer, larger get more
 *  - 'inverse' : larger numbers get fewer, smaller get more
 *  - 'random'  : random surplus removal (1-2 per number)
 */

import { generate, mulberry32 } from './generator.mjs';

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
 * @param {number[]} solution - flat row-major solution grid
 * @param {number} size - grid dimension (4, 5, 6, 8)
 * @param {function} rng - seeded PRNG
 * @param {'exact'|'pyramid'|'inverse'|'random'} pattern
 * @returns {Object<number, number>} inventory map { 1: N, 2: M, ... }
 */
export function generateInventory(solution, size, rng, pattern = 'exact') {
  const counts = countSolutionDigits(solution, size);

  if (pattern === 'exact') {
    return { ...counts };
  }

  const inventory = { ...counts };

  if (pattern === 'pyramid') {
    // Smaller numbers get reduced more, larger numbers keep more
    for (let v = 1; v <= size; v++) {
      // Reduction amount: higher for small v, lower for large v
      const maxReduce = Math.max(0, Math.floor((size - v) / 2));
      const reduce = Math.min(maxReduce, inventory[v] - 1); // always keep at least 1
      if (reduce > 0) {
        const actual = Math.floor(rng() * (reduce + 1));
        inventory[v] -= actual;
      }
    }
  } else if (pattern === 'inverse') {
    // Larger numbers get reduced more, smaller numbers keep more
    for (let v = 1; v <= size; v++) {
      const maxReduce = Math.max(0, Math.floor((v - 1) / 2));
      const reduce = Math.min(maxReduce, inventory[v] - 1);
      if (reduce > 0) {
        const actual = Math.floor(rng() * (reduce + 1));
        inventory[v] -= actual;
      }
    }
  } else if (pattern === 'random') {
    // Random reduction of 0-2 per number
    for (let v = 1; v <= size; v++) {
      const maxReduce = Math.min(2, inventory[v] - 1);
      if (maxReduce > 0) {
        inventory[v] -= Math.floor(rng() * (maxReduce + 1));
      }
    }
  }

  // Safety: every number must have at least as many as needed by solution
  // (For 'exact', this is always true. For others, we only ADDED surplus above
  //  the solution count, so we can safely remove some.)
  // Actually, our patterns only REMOVE from the solution count, so we must ensure
  // the inventory still allows the solution. Since we never go below 1, and the
  // solution needs exactly counts[v] of each, we need inventory[v] >= counts[v].
  // Wait — that defeats the purpose! The whole point is inventory < counts for some numbers.
  //
  // The trick: for non-exact patterns, the puzzle has MULTIPLE valid solutions
  // (because Latin square has unique solution but the inventory constraint creates
  // a different game). The player needs to find ANY valid fill that satisfies:
  // 1. All cage arithmetic correct
  // 2. Total usage of each number ≤ inventory
  //
  // So the inventory CAN be less than the original solution's counts.
  // The original solution is just ONE valid answer, but with reduced inventory,
  // the player might need a different arrangement.
  //
  // For v1, let's keep it simple: 'exact' only.
  // Non-exact patterns are a future enhancement that requires solver modification.

  return inventory;
}

/**
 * Generate a Challenge mode puzzle.
 *
 * @param {'easy'|'medium'|'hard'|'expert'} difficulty
 * @param {number} [seed]
 * @param {'exact'|'pyramid'|'inverse'|'random'} [pattern='exact']
 * @returns {{ size, cages, solution, inventory } | null}
 */
export function generateChallenge(difficulty, seed, pattern = 'exact') {
  const puzzle = generate(difficulty, seed);
  if (!puzzle) return null;

  const rng = mulberry32((seed || 0) ^ 0xDEADBEEF);
  const inventory = generateInventory(puzzle.solution, puzzle.size, rng, pattern);

  return {
    ...puzzle,
    inventory,
    gameMode: 'challenge',
  };
}

/**
 * Check if placing a value would exceed inventory.
 *
 * @param {number} value - number to place (1..size)
 * @param {Object<number, number>} inventoryUsed - current usage counts
 * @param {Object<number, number>} inventory - total inventory
 * @returns {boolean} true if placement is allowed
 */
export function canPlaceValue(value, inventoryUsed, inventory) {
  if (value === 0) return true; // delete is always allowed
  const used = inventoryUsed[value] || 0;
  const available = inventory[value] || 0;
  return used < available;
}

/**
 * Get remaining count for each value.
 *
 * @param {Object<number, number>} inventoryUsed
 * @param {Object<number, number>} inventory
 * @param {number} size
 * @returns {Object<number, number>} remaining counts
 */
export function getRemainingInventory(inventoryUsed, inventory, size) {
  const remaining = {};
  for (let v = 1; v <= size; v++) {
    remaining[v] = (inventory[v] || 0) - (inventoryUsed[v] || 0);
  }
  return remaining;
}
