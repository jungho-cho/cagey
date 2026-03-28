/**
 * Cagey -- Daily Puzzle Selector
 *
 * Uses a seeded PRNG to deterministically select a puzzle index for each day.
 * All dates are in KST (UTC+9).
 */

/**
 * mulberry32 -- seedable 32-bit PRNG (copied from generator.js)
 */
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * djb2 string hash -- simple, fast, no dependencies.
 */
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0; // ensure unsigned
}

/**
 * Get today's date string in KST (UTC+9) as "YYYY-MM-DD".
 */
function getKSTDateString(now?: Date): string {
  const d = now ?? new Date();
  // KST = UTC + 9 hours
  const kstMs = d.getTime() + 9 * 60 * 60 * 1000;
  const kst = new Date(kstMs);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns the puzzle index for today's daily challenge.
 * Same date (KST) always returns the same index.
 */
export function getDailyPuzzleIndex(bundleSize: number, now?: Date): number {
  const dateStr = getKSTDateString(now);
  const seed = djb2Hash(`cagey-${dateStr}`);
  const rng = mulberry32(seed);
  return Math.floor(rng() * bundleSize);
}

/**
 * Returns time remaining until KST midnight.
 */
export function getDailyCountdown(now?: Date): { hours: number; minutes: number } {
  const d = now ?? new Date();
  // Current KST time
  const kstMs = d.getTime() + 9 * 60 * 60 * 1000;
  const kst = new Date(kstMs);
  const hoursLeft = 23 - kst.getUTCHours();
  const minutesLeft = 59 - kst.getUTCMinutes();
  return { hours: hoursLeft, minutes: minutesLeft };
}

/**
 * Check if a new day (KST) has started since the last played date.
 */
export function isNewDay(lastPlayedDate: string, now?: Date): boolean {
  const todayStr = getKSTDateString(now);
  return todayStr !== lastPlayedDate;
}
