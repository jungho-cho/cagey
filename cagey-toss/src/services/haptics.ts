/**
 * Cagey -- Haptic Feedback Wrapper
 *
 * Uses React Native's Vibration API as a simple cross-platform fallback.
 * All functions are no-ops if Vibration is unavailable.
 */

import { Platform, Vibration } from 'react-native';

const IS_MOBILE = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Light impact -- cell tap.
 */
export function lightImpact(): void {
  if (!IS_MOBILE) return;
  try {
    Vibration.vibrate(10);
  } catch {
    // no-op
  }
}

/**
 * Medium impact -- cage complete.
 */
export function mediumImpact(): void {
  if (!IS_MOBILE) return;
  try {
    Vibration.vibrate(30);
  } catch {
    // no-op
  }
}

/**
 * Heavy impact -- puzzle clear.
 */
export function heavyImpact(): void {
  if (!IS_MOBILE) return;
  try {
    Vibration.vibrate(50);
  } catch {
    // no-op
  }
}

/**
 * Error vibration -- wrong answer.
 * Two short pulses.
 */
export function errorVibration(): void {
  if (!IS_MOBILE) return;
  try {
    Vibration.vibrate([0, 40, 60, 40]);
  } catch {
    // no-op
  }
}
