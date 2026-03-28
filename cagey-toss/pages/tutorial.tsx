/**
 * Cagey — Tutorial Screen
 * 3-step tutorial with hardcoded mini puzzles.
 */
import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { CommonActions } from '@granite-js/native/@react-navigation/native';
import { COLORS } from '../src/constants';

export const Route = createRoute('/tutorial', {
  validateParams: (params) => params,
  component: TutorialScreen,
});

interface TutorialStep {
  title: string;
  description: string;
  gridDisplay: string[][];
  cageInfo: string;
}

const STEPS: TutorialStep[] = [
  {
    title: '케이지(우리)란?',
    description:
      '굵은 선으로 둘러싸인 영역을 케이지라고 해요. 각 케이지의 왼쪽 위에 목표 숫자와 연산 기호가 표시됩니다.',
    gridDisplay: [
      ['3+', ''],
      ['', ''],
    ],
    cageInfo: '이 케이지의 두 칸의 합이 3이 되어야 해요',
  },
  {
    title: '숫자 규칙',
    description:
      '각 행과 열에 같은 숫자가 반복되면 안 됩니다. 4×4 퍼즐이라면 각 행/열에 1~4가 한 번씩 들어가야 해요.',
    gridDisplay: [
      ['1', '2', '3', '4'],
      ['3', '4', '1', '2'],
      ['2', '?', '?', '?'],
      ['4', '?', '?', '?'],
    ],
    cageInfo: '각 행과 열에 1~4가 한 번씩!',
  },
  {
    title: '연산 확인',
    description:
      '케이지 안의 숫자들을 표시된 연산(+, ×)으로 계산하면 목표 숫자가 나와야 합니다. 모든 칸을 올바르게 채우면 클리어!',
    gridDisplay: [
      ['6×', ''],
      ['', ''],
    ],
    cageInfo: '2 × 3 = 6 → 올바른 조합이에요!',
  },
];

function TutorialScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const goHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: '/' }],
      }),
    );
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      goHome();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <View style={styles.screen}>
      {/* Skip button */}
      <View style={styles.topBar}>
        <View style={styles.spacer} />
        <Pressable onPress={goHome} style={styles.skipButton}>
          <Text style={styles.skipText}>건너뛰기</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
        <Text style={styles.stepCount}>
          {step + 1}/{STEPS.length}
        </Text>

        {/* Title */}
        <Text style={styles.title}>{current.title}</Text>

        {/* Mini grid illustration */}
        <View style={styles.miniGrid}>
          {current.gridDisplay.map((row, ri) => (
            <View key={ri} style={styles.miniRow}>
              {row.map((cell, ci) => (
                <View key={ci} style={styles.miniCell}>
                  <Text
                    style={[
                      styles.miniCellText,
                      cell === '?' && styles.miniCellEmpty,
                    ]}
                  >
                    {cell}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Speech bubble */}
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>{current.description}</Text>
          <View style={styles.cageInfoBox}>
            <Text style={styles.cageInfoText}>{current.cageInfo}</Text>
          </View>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navRow}>
        {step > 0 ? (
          <Pressable style={styles.navButtonSecondary} onPress={handlePrev}>
            <Text style={styles.navButtonSecondaryText}>이전</Text>
          </Pressable>
        ) : (
          <View style={styles.navSpacer} />
        )}
        <Pressable style={styles.navButtonPrimary} onPress={handleNext}>
          <Text style={styles.navButtonPrimaryText}>
            {step < STEPS.length - 1 ? '다음' : '시작하기'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  spacer: {
    flex: 1,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
  },
  dotInactive: {
    backgroundColor: COLORS.border,
  },
  stepCount: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  miniGrid: {
    borderWidth: 2.5,
    borderColor: COLORS.cageBorder,
    borderRadius: 4,
    marginBottom: 24,
    overflow: 'hidden',
  },
  miniRow: {
    flexDirection: 'row',
  },
  miniCell: {
    width: 56,
    height: 56,
    borderWidth: 0.5,
    borderColor: COLORS.cellBorder,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  miniCellText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  miniCellEmpty: {
    color: COLORS.textMuted,
  },
  speechBubble: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  speechText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  cageInfoBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    padding: 10,
  },
  cageInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
  navRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  navSpacer: {
    flex: 1,
  },
  navButtonSecondary: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  navButtonPrimary: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  navButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
