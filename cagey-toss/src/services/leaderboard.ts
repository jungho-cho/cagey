/**
 * Cagey -- Apps-in-Toss Leaderboard SDK Wrapper
 *
 * Uses submitGameCenterLeaderBoardScore and openGameCenterLeaderboard
 * from @apps-in-toss/framework.
 *
 * Score formula: max(0, 3600 - elapsed_seconds)
 *   -> faster solves = higher score, 0 if over 1 hour
 *
 * 5 leaderboard IDs (configured in the Apps-in-Toss console):
 *   daily-medium, free-easy, free-medium, free-hard, free-expert
 */

import {
  submitGameCenterLeaderBoardScore,
  openGameCenterLeaderboard,
} from '@apps-in-toss/framework';
import type { Difficulty } from '../engine/types';

const LEADERBOARD_IDS: Record<string, string> = {
  'daily-medium': 'daily-medium',
  'free-easy': 'free-easy',
  'free-medium': 'free-medium',
  'free-hard': 'free-hard',
  'free-expert': 'free-expert',
};

/**
 * Calculate the leaderboard score from elapsed seconds.
 * Higher is better. Capped at 0 on the low end.
 */
export function calculateScore(elapsedSeconds: number): number {
  return Math.max(0, 3600 - Math.floor(elapsedSeconds));
}

/**
 * Submit a score to the appropriate leaderboard.
 */
export async function submitScore(
  difficulty: Difficulty,
  elapsedSeconds: number,
  isDaily: boolean,
): Promise<void> {
  const score = calculateScore(elapsedSeconds);
  const boardKey = isDaily ? 'daily-medium' : `free-${difficulty}`;
  const leaderboardId = LEADERBOARD_IDS[boardKey];

  if (!leaderboardId) {
    console.warn(`[leaderboard] unknown board key: ${boardKey}`);
    return;
  }

  try {
    const result = await submitGameCenterLeaderBoardScore({
      score: String(score),
    });

    if (!result) {
      console.warn('[leaderboard] not supported in this app version');
      return;
    }

    if (result.statusCode !== 'SUCCESS') {
      console.warn('[leaderboard] submission failed:', result.statusCode);
    }
  } catch (err) {
    console.warn('[leaderboard] submission error:', err);
  }
}

/**
 * Open the leaderboard WebView.
 */
export function openLeaderboard(): void {
  try {
    openGameCenterLeaderboard();
  } catch (err) {
    console.warn('[leaderboard] failed to open:', err);
  }
}
