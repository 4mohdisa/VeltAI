// Dynamic Type helpers (HIG §2.2). useWindowDimensions().fontScale is reactive —
// it re-renders when the user changes their text size, so rows that switch to a
// stacked layout at large sizes update live.
import { useWindowDimensions } from 'react-native';

import { LARGE_TEXT_THRESHOLD } from './tokens';

/** Current Dynamic Type font scale (1.0 at default). Reactive. */
export function useFontScale(): number {
  return useWindowDimensions().fontScale;
}

/** True when the user's text size is large (≈AX1+) — crowded rows should stack. */
export function useLargeText(): boolean {
  return useWindowDimensions().fontScale >= LARGE_TEXT_THRESHOLD;
}
