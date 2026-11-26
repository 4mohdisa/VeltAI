// Row 9, Settings side: the "Thinking of leaving" row on the main Settings list
// (src/app/profile/index.tsx). Typed routes lack /profile/leaving, so the row
// opens it through navigate().
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import ProfileScreen from '@/app/profile/index';
import en from '@/lib/i18n/locales/en.json';
import { navigate } from '@/lib/nav';
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

jest.mock('@/lib/nav', () => ({ navigate: jest.fn() }));

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

test('pressing Thinking of leaving opens /profile/leaving', async () => {
  const tree = await render();
  const row = findAll(
    tree,
    (p) => p.accessibilityRole === 'button' && p.accessibilityLabel === en.subscription.leaving.settingsRow,
  )[0];
  expect(row).toBeDefined();
  await act(async () => {
    row.props.onPress();
  });
  expect(navigate).toHaveBeenCalledTimes(1);
  expect(navigate).toHaveBeenCalledWith('/profile/leaving');
});
