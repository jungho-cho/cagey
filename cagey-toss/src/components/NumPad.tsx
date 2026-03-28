/**
 * Cagey — NumPad Component
 * 3-column grid of number buttons + backspace.
 */
import React from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { COLORS } from '../constants';

interface NumPadProps {
  maxNumber: number; // grid size determines max digit
  disabled: boolean; // true when no cell selected
  onNumber: (n: number) => void;
  onBackspace: () => void;
}

function NumPadComponent({ maxNumber, disabled, onNumber, onBackspace }: NumPadProps) {
  const buttons: Array<{ label: string; action: () => void }> = [];

  for (let i = 1; i <= maxNumber; i++) {
    const num = i;
    buttons.push({ label: String(i), action: () => onNumber(num) });
  }
  buttons.push({ label: '⌫', action: onBackspace });

  // Pad to fill last row
  while (buttons.length % 3 !== 0) {
    buttons.push({ label: '', action: () => {} });
  }

  const rows: Array<typeof buttons> = [];
  for (let i = 0; i < buttons.length; i += 3) {
    rows.push(buttons.slice(i, i + 3));
  }

  return (
    <View style={styles.container}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((btn, ci) => {
            if (btn.label === '') {
              return <View key={ci} style={styles.buttonPlaceholder} />;
            }
            const isBackspace = btn.label === '⌫';
            return (
              <Pressable
                key={ci}
                onPress={btn.action}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.button,
                  isBackspace && styles.backspaceButton,
                  disabled && styles.buttonDisabled,
                  pressed && !disabled && styles.buttonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    isBackspace && styles.backspaceText,
                    disabled && styles.buttonTextDisabled,
                  ]}
                >
                  {btn.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export const NumPad = React.memo(NumPadComponent);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  button: {
    width: 72,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backspaceButton: {
    backgroundColor: COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    backgroundColor: COLORS.primaryLight,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  backspaceText: {
    fontSize: 20,
  },
  buttonTextDisabled: {
    color: COLORS.textMuted,
  },
  buttonPlaceholder: {
    width: 72,
    height: 48,
  },
});
