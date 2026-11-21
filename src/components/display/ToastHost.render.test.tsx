// ToastHost — the global toast surface. PHASE2_ROWS.md row 5 (Quick add): its
// own comments name both halves of this test — "a native formSheet" logging
// to the day via selectedFoodDate(), and "the success toast" shown after.
// Render smoke test only: mounts the real component and checks the empty
// state renders nothing visible, then that a real showToast() call renders
// the toast's message.
//
// useSafeAreaInsets needs a SafeAreaProvider ancestor (same pattern as
// Screen.render.test.tsx / dashboardSummary.render.test.tsx).
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { ToastHost } from '@/components/display/ToastHost';
import { showToast, useToastStore } from '@/components/display/toastStore';
import { act, allText, findAll, renderScreen } from '../../__tests__/render/helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const alerts = (tree: ReturnType<typeof renderScreen>) => findAll(tree, (p) => p.accessibilityRole === 'alert');

beforeEach(() => {
  useToastStore.getState().dismiss();
});

test('ToastHost renders nothing visible with no toast showing', () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ToastHost />
    </SafeAreaProvider>,
  );
  expect(alerts(tree)).toHaveLength(0);
});

test('ToastHost renders the message after a real showToast call', async () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ToastHost />
    </SafeAreaProvider>,
  );
  // Lets useReduceMotion's AccessibilityInfo.isReduceMotionEnabled() promise
  // settle inside act(), same as the settle() pattern in dashboardSummary.
  await act(async () => {
    await Promise.resolve();
  });
  act(() => {
    showToast({ message: 'Meal logged.', tone: 'success' });
  });
  expect(alerts(tree).length).toBeGreaterThan(0);
  expect(allText(tree)).toContain('Meal logged.');
});
