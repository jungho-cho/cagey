/**
 * Cagey -- Sound Effect Wrapper
 *
 * Placeholder implementation. All functions are no-ops until
 * sound asset files are added and a playback library is integrated.
 */

let _soundEnabled = true;

export function setSoundEnabled(enabled: boolean): void {
  _soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return _soundEnabled;
}

/** Cell tap sound. */
export function playTap(): void {
  if (!_soundEnabled) return;
  // TODO: play tap.mp3
}

/** Cage / action success sound. */
export function playSuccess(): void {
  if (!_soundEnabled) return;
  // TODO: play success.mp3
}

/** Puzzle clear fanfare. */
export function playClear(): void {
  if (!_soundEnabled) return;
  // TODO: play clear.mp3
}

/** Error / wrong answer sound. */
export function playError(): void {
  if (!_soundEnabled) return;
  // TODO: play error.mp3
}
