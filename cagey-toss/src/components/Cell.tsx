/**
 * Cagey — Cell Component
 * Single cell in the puzzle grid.
 */
import React from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { COLORS } from '../constants';
import type { CellDisplayStatus } from '../engine/types';

interface CellProps {
  value: number;
  isSelected: boolean;
  status: CellDisplayStatus;
  cageLabel?: string; // e.g. "6+" shown in top-left of first cage cell
  size: number; // cell width/height
  borderTop: boolean;
  borderRight: boolean;
  borderBottom: boolean;
  borderLeft: boolean;
  onPress: () => void;
}

function CellComponent({
  value,
  isSelected,
  status,
  cageLabel,
  size,
  borderTop,
  borderRight,
  borderBottom,
  borderLeft,
  onPress,
}: CellProps) {
  const bgColor = isSelected
    ? COLORS.selected
    : status === 'correct'
      ? COLORS.correctLight
      : status === 'incorrect'
        ? COLORS.incorrectLight
        : COLORS.white;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor: bgColor,
          borderTopWidth: borderTop ? 2.5 : 0.5,
          borderRightWidth: borderRight ? 2.5 : 0.5,
          borderBottomWidth: borderBottom ? 2.5 : 0.5,
          borderLeftWidth: borderLeft ? 2.5 : 0.5,
          borderTopColor: borderTop ? COLORS.cageBorder : COLORS.cellBorder,
          borderRightColor: borderRight ? COLORS.cageBorder : COLORS.cellBorder,
          borderBottomColor: borderBottom ? COLORS.cageBorder : COLORS.cellBorder,
          borderLeftColor: borderLeft ? COLORS.cageBorder : COLORS.cellBorder,
        },
      ]}
    >
      {cageLabel != null && (
        <View style={styles.labelContainer}>
          <Text style={styles.cageLabel}>{cageLabel}</Text>
        </View>
      )}
      <Text style={[styles.value, value === 0 && styles.valueEmpty]}>
        {value > 0 ? String(value) : ''}
      </Text>
    </Pressable>
  );
}

export const Cell = React.memo(CellComponent);

const styles = StyleSheet.create({
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  labelContainer: {
    position: 'absolute',
    top: 1,
    left: 3,
  },
  cageLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  valueEmpty: {
    color: 'transparent',
  },
});
