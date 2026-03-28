/**
 * Cagey -- AsyncStorage Wrapper
 *
 * All persistent data goes through this module.
 * Every read uses try/catch with sensible defaults so the app never
 * crashes on corrupt or missing data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Difficulty } from '../engine/types';

// ---- Storage keys ----
const KEYS = {
  STREAK: 'cagey_streak',
  STATS: 'cagey_stats',
  BADGES: 'cagey_badges',
  AD_COUNTER: 'cagey_ad_counter',
  TUTORIAL_DONE: 'cagey_tutorial_done',
  DAILY_COMPLETED: 'cagey_daily_completed',
  HINT_COUNT: 'cagey_hint_count',
} as const;

// ---- Helpers ----

async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function setJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silently ignore write failures
  }
}

// ================================================================
// Streak
// ================================================================

interface StreakData {
  current: number;
  max: number;
  lastDate: string;
}

const DEFAULT_STREAK: StreakData = { current: 0, max: 0, lastDate: '' };

export async function getStreak(): Promise<StreakData> {
  return getJSON(KEYS.STREAK, DEFAULT_STREAK);
}

/**
 * Increment streak if played today (KST).
 * Resets to 1 if a day was missed.
 * Returns the updated { current, max }.
 */
export async function updateStreak(): Promise<{ current: number; max: number }> {
  const streak = await getStreak();
  const today = getKSTDateString();

  if (streak.lastDate === today) {
    // Already counted today
    return { current: streak.current, max: streak.max };
  }

  const yesterday = getKSTDateString(
    new Date(Date.now() - 24 * 60 * 60 * 1000),
  );

  let newCurrent: number;
  if (streak.lastDate === yesterday) {
    newCurrent = streak.current + 1;
  } else {
    newCurrent = 1; // streak broken
  }

  const newMax = Math.max(streak.max, newCurrent);
  const updated: StreakData = { current: newCurrent, max: newMax, lastDate: today };
  await setJSON(KEYS.STREAK, updated);
  return { current: newCurrent, max: newMax };
}

// ================================================================
// Stats
// ================================================================

interface DifficultyStats {
  clears: number;
  bestTime: number;
  avgTime: number;
  totalTime: number;
}

type StatsData = Record<Difficulty, DifficultyStats>;

const DEFAULT_DIFFICULTY_STATS: DifficultyStats = {
  clears: 0,
  bestTime: Number.MAX_SAFE_INTEGER,
  avgTime: 0,
  totalTime: 0,
};

function makeDefaultStats(): StatsData {
  return {
    easy: { ...DEFAULT_DIFFICULTY_STATS },
    medium: { ...DEFAULT_DIFFICULTY_STATS },
    hard: { ...DEFAULT_DIFFICULTY_STATS },
    expert: { ...DEFAULT_DIFFICULTY_STATS },
  };
}

export async function getStats(): Promise<StatsData> {
  const stats = await getJSON(KEYS.STATS, null);
  if (!stats) return makeDefaultStats();
  // Merge with defaults to handle partial / old data
  const base = makeDefaultStats();
  for (const key of ['easy', 'medium', 'hard', 'expert'] as Difficulty[]) {
    if ((stats as Record<string, DifficultyStats>)[key]) {
      base[key] = { ...DEFAULT_DIFFICULTY_STATS, ...(stats as Record<string, DifficultyStats>)[key] };
    }
  }
  return base;
}

export async function recordSolve(
  difficulty: Difficulty,
  timeSeconds: number,
): Promise<void> {
  const stats = await getStats();
  const ds = stats[difficulty];
  ds.clears += 1;
  ds.totalTime += timeSeconds;
  ds.avgTime = ds.totalTime / ds.clears;
  if (timeSeconds < ds.bestTime) {
    ds.bestTime = timeSeconds;
  }
  await setJSON(KEYS.STATS, stats);
}

// ================================================================
// Badges
// ================================================================

export async function getBadges(): Promise<string[]> {
  return getJSON(KEYS.BADGES, [] as string[]);
}

/**
 * Check all badge conditions and unlock any newly earned badges.
 * Returns an array of newly unlocked badge IDs.
 */
export async function checkAndUnlockBadges(
  stats: StatsData,
  streak: { current: number; max: number },
): Promise<string[]> {
  // Import dynamically to avoid circular dependency at module level
  const { checkBadgeCondition, BADGES } = await import('../data/badges');

  const existing = await getBadges();
  const newlyUnlocked: string[] = [];

  for (const badge of BADGES) {
    if (existing.includes(badge.id)) continue;
    if (checkBadgeCondition(badge.id, stats, streak)) {
      newlyUnlocked.push(badge.id);
    }
  }

  if (newlyUnlocked.length > 0) {
    await setJSON(KEYS.BADGES, [...existing, ...newlyUnlocked]);
  }

  return newlyUnlocked;
}

// ================================================================
// Ad Counter
// ================================================================

export async function getAdCounter(): Promise<number> {
  return getJSON(KEYS.AD_COUNTER, 0);
}

export async function incrementAdCounter(): Promise<number> {
  const count = (await getAdCounter()) + 1;
  await setJSON(KEYS.AD_COUNTER, count);
  return count;
}

export async function resetAdCounter(): Promise<void> {
  await setJSON(KEYS.AD_COUNTER, 0);
}

// ================================================================
// Tutorial
// ================================================================

export async function isTutorialDone(): Promise<boolean> {
  return getJSON(KEYS.TUTORIAL_DONE, false);
}

export async function setTutorialDone(): Promise<void> {
  await setJSON(KEYS.TUTORIAL_DONE, true);
}

// ================================================================
// Daily Completed
// ================================================================

export async function getDailyCompleted(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.DAILY_COMPLETED);
    if (!raw) return null;
    const date = JSON.parse(raw) as string;
    // Only return if it matches today
    const today = getKSTDateString();
    return date === today ? date : null;
  } catch {
    return null;
  }
}

export async function setDailyCompleted(date: string): Promise<void> {
  await setJSON(KEYS.DAILY_COMPLETED, date);
}

// ================================================================
// Hints
// ================================================================

const HINT_KEY_PREFIX = 'cagey_hint_';

function hintKeyForDate(date: string): string {
  return `${HINT_KEY_PREFIX}${date}`;
}

export async function getHintCount(): Promise<number> {
  const today = getKSTDateString();
  await cleanupOldHintKeys(today);
  return getJSON(hintKeyForDate(today), 0);
}

async function cleanupOldHintKeys(todayStr: string): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const allKeys: string[] = await AsyncStorage.getAllKeys();
    const hintKeys = allKeys.filter(
      (k: string) => k.startsWith(HINT_KEY_PREFIX) && k !== hintKeyForDate(todayStr),
    );
    // Keep last 7 days, remove older
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const oldKeys = hintKeys.filter((k: string) => {
      const dateStr = k.replace(HINT_KEY_PREFIX, '');
      return dateStr < cutoffStr;
    });
    if (oldKeys.length > 0) {
      await AsyncStorage.multiRemove(oldKeys);
    }
  } catch {
    // Non-critical cleanup, ignore errors
  }
}

export async function incrementHintCount(): Promise<number> {
  const today = getKSTDateString();
  const key = hintKeyForDate(today);
  const count = (await getJSON(key, 0)) + 1;
  await setJSON(key, count);
  return count;
}

export async function resetDailyHints(date: string): Promise<void> {
  await setJSON(hintKeyForDate(date), 0);
}

// ================================================================
// KST date helper (duplicated from daily.ts to avoid cross-dependency)
// ================================================================

function getKSTDateString(now?: Date): string {
  const d = now ?? new Date();
  const kstMs = d.getTime() + 9 * 60 * 60 * 1000;
  const kst = new Date(kstMs);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
