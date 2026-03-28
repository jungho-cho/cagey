/**
 * Cagey — Constants
 */

export const COLORS = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  correct: '#16A34A',
  correctLight: '#DCFCE7',
  incorrect: '#DC2626',
  incorrectLight: '#FEE2E2',
  selected: '#DBEAFE',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  white: '#FFFFFF',
  black: '#000000',
  cageBorder: '#334155',
  cellBorder: '#CBD5E1',
  overlay: 'rgba(0,0,0,0.5)',
} as const;

export const DIFFICULTY_NAMES: Record<string, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
  expert: '전문가',
};

export const GRID_SIZES: Record<string, number> = {
  easy: 4,
  medium: 5,
  hard: 6,
  expert: 8,
};

export const DIFFICULTY_KEYS = ['easy', 'medium', 'hard', 'expert'] as const;

/** 4x4 mock puzzle for placeholder screens */
export const MOCK_PUZZLE = {
  size: 4,
  cages: [
    { cells: [0, 1], op: '+' as const, target: 3 },
    { cells: [2, 3], op: '*' as const, target: 8 },
    { cells: [4, 5, 8], op: '+' as const, target: 9 },
    { cells: [6, 7], op: '+' as const, target: 5 },
    { cells: [9, 13], op: '*' as const, target: 6 },
    { cells: [10, 11], op: '+' as const, target: 7 },
    { cells: [12, 14, 15], op: '+' as const, target: 8 },
  ],
  solution: [1, 2, 4, 2, 3, 4, 1, 4, 2, 3, 3, 4, 3, 2, 1, 4],
};

export const ACHIEVEMENT_BADGES = [
  { id: 'first_clear', icon: '🏆', label: '첫 클리어' },
  { id: 'easy_master', icon: '🎯', label: '쉬움 마스터' },
  { id: 'medium_master', icon: '⭐', label: '보통 마스터' },
  { id: 'hard_master', icon: '💎', label: '어려움 마스터' },
  { id: 'expert_master', icon: '👑', label: '전문가 마스터' },
  { id: 'streak_7', icon: '🔥', label: '7일 연속' },
  { id: 'plays_50', icon: '🚀', label: '50판 돌파' },
];
