/**
 * Cagey — Clear Screen
 */
import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { CommonActions } from '@granite-js/native/@react-navigation/native';
import { COLORS, DIFFICULTY_NAMES } from '../src/constants';

export const Route = createRoute('/clear', {
  validateParams: (params) => params as { time: string; difficulty: string },
  component: ClearScreen,
});

function ClearScreen() {
  const navigation = useNavigation();
  const params = Route.useParams();
  const elapsed = parseInt(params.time || '0', 10);
  const difficulty = params.difficulty || 'easy';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const goHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: '/' }],
      }),
    );
  };

  const nextPuzzle = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          { name: '/' },
          { name: '/game', params: { difficulty, isDaily: 'false' } },
        ],
      }),
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        {/* Trophy */}
        <Text style={styles.trophy}>🎉</Text>
        <Text style={styles.title}>클리어!</Text>
        <Text style={styles.subtitle}>퍼즐을 완성했습니다</Text>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>풀이 시간</Text>
            <Text style={styles.statValue}>{formatTime(elapsed)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>난이도</Text>
            <Text style={styles.statValue}>{DIFFICULTY_NAMES[difficulty] || difficulty}</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <Pressable style={styles.primaryButton} onPress={nextPuzzle}>
            <Text style={styles.primaryButtonText}>다음 퍼즐</Text>
          </Pressable>
          <Pressable style={styles.outlineButton} onPress={() => {}}>
            <Text style={styles.outlineButtonText}>리더보드 보기</Text>
          </Pressable>
          <Pressable style={styles.textButton} onPress={goHome}>
            <Text style={styles.textButtonText}>홈으로</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  trophy: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  statsCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
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
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  outlineButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  outlineButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
  },
  textButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  textButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
