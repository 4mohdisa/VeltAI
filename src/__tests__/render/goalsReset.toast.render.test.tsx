// PHASE3_ROWS.md row 15, Goals screen (src/app/profile/goals.tsx) reset toast.
// Pressing "Reset to AI recommendation" in custom mode shows the reset message
// from en.json (goals.resetDone), not the generic goals.saved confirmation.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import GoalsScreen from '@/app/profile/goals';
import { useToastStore } from '@/components/display/toastStore';
import en from '@/lib/i18n/locales/en.json';
import { useSettingsStore } from '@/lib/settings/store';
import { act, findAll, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

beforeEach(() => {
  useSettingsStore.getState().reset();
  useSettingsStore.getState().setGoalMode('custom');
  useToastStore.getState().dismiss();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() =>
    Promise.resolve({ ok: false, status: 404, json: async () => ({ data: null, error: 'error' }) }),
  );
});

test('the reset control shows goals.resetDone, not goals.saved', async () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <GoalsScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });

  const reset = findAll(tree, (p) => p.accessibilityLabel === en.goals.resetToAi && typeof p.onPress === 'function');
  expect(reset.length).toBeGreaterThan(0);
  act(() => {
    (reset[0].props.onPress as () => void)();
  });

  const message = useToastStore.getState().current?.message;
  expect(message).toBe(en.goals.resetDone);
  expect(message).not.toBe(en.goals.saved);
});
