/**
 * Cagey — Home Screen
 */
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { COLORS, DIFFICULTY_NAMES, DIFFICULTY_KEYS } from '../src/constants';
import { getStreak } from '../src/services/storage';
import { getDailyCountdown } from '../src/engine/daily';
import { openLeaderboard } from '../src/services/leaderboard';

export const Route = createRoute('/', {
  validateParams: (params) => params,
  component: HomeScreen,
});

function HomeScreen() {
  const navigation = useNavigation();
  const [streak, setStreak] = useState(0);
  const [countdown, setCountdown] = useState('');

  // Load streak from storage on mount
  useEffect(() => {
    getStreak().then((s) => setStreak(s.current));
  }, []);

  // Countdown using KST-based daily countdown
  useEffect(() => {
    const updateCountdown = () => {
      const { hours, minutes } = getDailyCountdown();
      const now = new Date();
      const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
      const kst = new Date(kstMs);
      const secondsLeft = 59 - kst.getUTCSeconds();
      setCountdown(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`,
      );
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDailyChallenge = () => {
    navigation.navigate('/game', { difficulty: 'medium', isDaily: 'true' });
  };

  const handleDifficulty = (diff: string) => {
    navigation.navigate('/game', { difficulty: diff, isDaily: 'false' });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cagey</Text>
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥{streak}</Text>
          </View>
        )}
      </View>

      {/* Daily Challenge Card */}
      <Pressable style={styles.dailyCard} onPress={handleDailyChallenge}>
        <Text style={styles.dailyLabel}>오늘의 도전</Text>
        <Text style={styles.dailySubtitle}>매일 새로운 퍼즐에 도전하세요</Text>
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownLabel}>다음 퍼즐까지</Text>
          <Text style={styles.countdown}>{countdown}</Text>
        </View>
        <View style={styles.dailyButton}>
          <Text style={styles.dailyButtonText}>도전하기</Text>
        </View>
      </Pressable>

      {/* Difficulty Selection */}
      <Text style={styles.sectionTitle}>난이도 선택</Text>
      <View style={styles.chipRow}>
        {DIFFICULTY_KEYS.map((key) => (
          <Pressable
            key={key}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            onPress={() => handleDifficulty(key)}
          >
            <Text style={styles.chipText}>{DIFFICULTY_NAMES[key]}</Text>
          </Pressable>
        ))}
      </View>

      {/* Tutorial */}
      <Pressable
        style={styles.tutorialButton}
        onPress={() => navigation.navigate('/tutorial')}
      >
        <Text style={styles.tutorialButtonText}>📖 게임 방법 배우기</Text>
      </Pressable>

      {/* Bottom buttons */}
      <View style={styles.bottomRow}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('/stats')}
        >
          <Text style={styles.secondaryButtonText}>통계</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => openLeaderboard()}>
          <Text style={styles.secondaryButtonText}>리더보드</Text>
        </Pressable>
      </View>

      {/* Banner Ad Placeholder */}
      <View style={styles.bannerAd}>
        <Text style={styles.bannerAdText}>광고 영역</Text>
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
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  streakBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
  },
  dailyCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  dailyLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  dailySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  countdownLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  countdown: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    fontVariant: ['tabular-nums'],
  },
  dailyButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dailyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipPressed: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  tutorialButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tutorialButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  bannerAd: {
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  bannerAdText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
