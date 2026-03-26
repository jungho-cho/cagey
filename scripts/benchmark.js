#!/usr/bin/env node
/**
 * Cagey — Performance Benchmark
 *
 * Tests 8×8 expert puzzle generation 10 times.
 * Pass criterion: average < 2000ms
 *
 * Run: node scripts/benchmark.js
 */

'use strict';

const { generate } = require('../src/generator');

const RUNS = 10;
const BUDGET_MS = 2000;

console.log(`\nCagey 8×8 Expert Solver Benchmark (${RUNS} runs)\n${'─'.repeat(45)}`);

const times = [];
let failures = 0;

for (let i = 0; i < RUNS; i++) {
  const start = Date.now();
  const puzzle = generate('expert', i * 7919); // deterministic seeds
  const elapsed = Date.now() - start;
  times.push(elapsed);

  const status = puzzle ? '✓' : '✗ (fallback needed)';
  if (!puzzle) failures++;
  console.log(`  Run ${String(i + 1).padStart(2)}: ${String(elapsed).padStart(5)}ms  ${status}`);
}

const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
const max = Math.max(...times);
const min = Math.min(...times);

console.log(`\n${'─'.repeat(45)}`);
console.log(`  Min: ${min}ms`);
console.log(`  Max: ${max}ms`);
console.log(`  Avg: ${avg}ms  (budget: <${BUDGET_MS}ms)`);
if (failures > 0) console.log(`  Fallbacks needed: ${failures}/${RUNS}`);

console.log();
if (avg <= BUDGET_MS && failures === 0) {
  console.log('  PASS ✓  — within budget, no fallbacks needed');
  process.exit(0);
} else if (avg <= BUDGET_MS) {
  console.log(`  PASS with WARNINGS ⚠  — within budget but ${failures} run(s) needed fallback`);
  process.exit(0);
} else {
  console.log(`  FAIL ✗  — avg ${avg}ms exceeds ${BUDGET_MS}ms budget`);
  console.log('  Consider: arc consistency, bundled Expert puzzles as fallback');
  process.exit(1);
}
