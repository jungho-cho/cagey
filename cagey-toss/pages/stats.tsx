/**
 * Cagey — Stats Screen
 */
import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { COLORS, DIFFICULTY_NAMES, DIFFICULTY_KEYS, ACHIEVEMENT_BADGES } from '../src/constants';

export const Route = createRoute('/stats', {
  validateParams: (params) => params,
  component: StatsScreen,
});

// Placeholder stats
const MOCK_STATS: Record<
  string,
  { clears: number; bestTime: number; avgTime: number }
> = {
  easy: { clears: 12, bestTime: 87, avgTime: 145 },
  medium: { clears: 5, bestTime: 210, avgTime: 340 },
  hard: { clears: 2, bestTime: 480, avgTime: 520 },
  expert: { clears: 0, bestTime: 0, avgTime: 0 },
};

const MOCK_OVERALL = {
  totalPlays: 23,
  currentStreak: 3,
  maxStreak: 7,
};

function formatTime(secs: number): string {
  if (secs === 0) return '--:--';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function StatsScreen() {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState('easy');
  const stats = MOCK_STATS[selectedTab];

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>통계</Text>
        <View style={styles.backButton} />
      </View>

      {/* Overall Stats */}
      <View style={styles.overallCard}>
        <View style={styles.overallItem}>
          <Text style={styles.overallValue}>{MOCK_OVERALL.totalPlays}</Text>
          <Text style={styles.overallLabel}>총 플레이</Text>
        </View>
        <View style={styles.overallDivider} />
        <View style={styles.overallItem}>
          <Text style={styles.overallValue}>🔥{MOCK_OVERALL.currentStreak}</Text>
          <Text style={styles.overallLabel}>현재 스트릭</Text>
        </View>
        <View style={styles.overallDivider} />
        <View style={styles.overallItem}>
          <Text style={styles.overallValue}>{MOCK_OVERALL.maxStreak}</Text>
          <Text style={styles.overallLabel}>최대 스트릭</Text>
        </View>
      </View>

      {/* Difficulty Tabs */}
      <View style={styles.tabRow}>
        {DIFFICULTY_KEYS.map((key) => (
          <Pressable
            key={key}
            style={[styles.tab, selectedTab === key && styles.tabActive]}
            onPress={() => setSelectedTab(key)}
          >
            <Text style={[styles.tabText, selectedTab === key && styles.tabTextActive]}>
              {DIFFICULTY_NAMES[key]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Per-difficulty Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>클리어 횟수</Text>
          <Text style={styles.statValue}>{stats.clears}회</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>최고 시간</Text>
          <Text style={styles.statValue}>{formatTime(stats.bestTime)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>평균 시간</Text>
          <Text style={styles.statValue}>{formatTime(stats.avgTime)}</Text>
        </View>
      </View>

      {/* Achievement Badges */}
      <Text style={styles.sectionTitle}>업적</Text>
      <View style={styles.badgeGrid}>
        {ACHIEVEMENT_BADGES.map((badge) => {
          const unlocked = badge.id === 'first_clear' || badge.id === 'streak_3';
          return (
            <View
              key={badge.id}
              style={[styles.badge, !unlocked && styles.badgeLocked]}
            >
              <Text style={[styles.badgeIcon, !unlocked && styles.badgeIconLocked]}>
                {badge.icon}
              </Text>
              <Text style={[styles.badgeLabel, !unlocked && styles.badgeLabelLocked]}>
                {badge.label}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    padding: 4,
  },
  backText: {
    fontSize: 22,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  overallCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  overallItem: {
    flex: 1,
    alignItems: 'center',
  },
  overallValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  overallLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  overallDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  statsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
  },
  badgeLocked: {
    opacity: 0.4,
  },
  badgeIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  badgeIconLocked: {
    opacity: 0.5,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  badgeLabelLocked: {
    color: COLORS.textMuted,
  },
});
