/**
 * Cagey -- Badge Definitions
 *
 * 7 badges with unlock conditions checked against stats + streak.
 */

import type { Difficulty } from '../engine/types';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string; // human-readable condition description
}

interface DifficultyStats {
  clears: number;
  bestTime: number;
  avgTime: number;
  totalTime: number;
}

type StatsData = Record<Difficulty, DifficultyStats>;

export const BADGES: Badge[] = [
  {
    id: 'first_clear',
    name: '첫 클리어',
    description: '첫 번째 퍼즐을 클리어했어요!',
    icon: '🏆',
    condition: '퍼즐 1회 클리어',
  },
  {
    id: 'easy_master',
    name: '쉬움 마스터',
    description: '쉬움 난이도를 10회 클리어했어요!',
    icon: '🎯',
    condition: '쉬움 10회 클리어',
  },
  {
    id: 'medium_master',
    name: '보통 마스터',
    description: '보통 난이도를 10회 클리어했어요!',
    icon: '⭐',
    condition: '보통 10회 클리어',
  },
  {
    id: 'hard_master',
    name: '어려움 마스터',
    description: '어려움 난이도를 10회 클리어했어요!',
    icon: '💎',
    condition: '어려움 10회 클리어',
  },
  {
    id: 'expert_master',
    name: '전문가 마스터',
    description: '전문가 난이도를 5회 클리어했어요!',
    icon: '👑',
    condition: '전문가 5회 클리어',
  },
  {
    id: 'streak_7',
    name: '7일 연속',
    description: '7일 연속으로 퍼즐을 풀었어요!',
    icon: '🔥',
    condition: '7일 연속 클리어',
  },
  {
    id: 'plays_50',
    name: '50판 돌파',
    description: '총 50판을 클리어했어요!',
    icon: '🚀',
    condition: '총 50회 클리어',
  },
];

/**
 * Check whether a badge's unlock condition is met.
 */
export function checkBadgeCondition(
  badgeId: string,
  stats: StatsData,
  streak: { current: number; max: number },
): boolean {
  const totalClears =
    stats.easy.clears +
    stats.medium.clears +
    stats.hard.clears +
    stats.expert.clears;

  switch (badgeId) {
    case 'first_clear':
      return totalClears >= 1;
    case 'easy_master':
      return stats.easy.clears >= 10;
    case 'medium_master':
      return stats.medium.clears >= 10;
    case 'hard_master':
      return stats.hard.clears >= 10;
    case 'expert_master':
      return stats.expert.clears >= 5;
    case 'streak_7':
      return streak.max >= 7;
    case 'plays_50':
      return totalClears >= 50;
    default:
      return false;
  }
}
