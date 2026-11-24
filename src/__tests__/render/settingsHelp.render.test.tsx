// PHASE3_ROWS.md row 10, Settings side: the "Help and feedback" row on the main
// Settings list (src/app/profile/index.tsx). It renders with its localised label
// and VoiceOver hint, and one press opens /profile/feedback.
import { router } from 'expo-router';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import ProfileScreen from '@/app/profile/index';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));

jest.mock('@/lib/api', () => ({
  api: { profile: { export: jest.fn() } },
}));

jest.mock('@/lib/data', () => ({
  useUserProfile: () => ({ name: 'Sam' }),
  useGym: () => ({
    data: { streak: { current: 0, longest: 0, totalGymDays: 0, freezesAvailable: 0 } },
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/components/domain/StreakCounter', () => ({ StreakCounter: () => null }));

jest.mock('@/lib/auth/appState', () => ({
  useAppState: () => ({ dispatch: jest.fn() }),
}));

jest.mock('@/lib/billing/purchases', () => ({
  hasProEntitlement: () => false,
  isBillingEnabled: () => false,
  restorePurchases: jest.fn(),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

async function render() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ProfileScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

const helpRow = (tree: Awaited<ReturnType<typeof render>>) =>
  findAll(tree, (p) => p.accessibilityRole === 'button' && p.accessibilityLabel === en.profile.helpAndFeedback)[0];

test('the help and feedback row renders with its label and VoiceOver hint', async () => {
  const row = helpRow(await render());
  expect(row).toBeDefined();
  expect(row.props.accessibilityHint).toBe(en.profile.helpAndFeedbackHint);
});

test('pressing the row opens /profile/feedback', async () => {
  const tree = await render();
  await act(async () => {
    helpRow(tree).props.onPress();
  });
  expect(router.push).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledWith('/profile/feedback');
});
