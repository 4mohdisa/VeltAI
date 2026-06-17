// Haptics (HIG §9) — one place that maps app moments to the right feedback, built
// on expo-haptics (already a dependency). Fire-and-forget; never throws. ALWAYS
// pair a haptic with a visual change, and never fire on scroll / in rapid repeat.
import * as Haptics from 'expo-haptics';

function run(p: Promise<void>) {
  p.catch(() => {});
}

export const haptics = {
  /** Action completed — meal logged, gym session logged, goal saved. */
  success: () => run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Error / failure — scan failed, save failed. */
  error: () => run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  /** Warning — streak at risk surfaced, destructive confirm appears. */
  warning: () => run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  /** Selection change — segmented control, unit toggle, picker tick. */
  selection: () => run(Haptics.selectionAsync()),
  /** Pull-to-refresh trigger. */
  impactLight: () => run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Primary CTA tap (the black button). */
  impactMedium: () => run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Destructive swipe completes (delete). */
  impactHeavy: () => run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
};
