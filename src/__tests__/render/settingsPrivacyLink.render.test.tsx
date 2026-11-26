// Row 14: the main Settings list (src/app/profile/index.tsx) links to the in-app
// Privacy Policy. The About group's Privacy Policy row opens /legal/privacy.
import { router } from 'expo-router';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import ProfileScreen from '@/app/profile/index';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

// The same mocks as settingsHelp.render.test.tsx: loaded profile and streak data
// (so Settings renders its rows, not the skeleton), no animated streak flame, and
// no network, auth or billing.
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

test('the Privacy Policy row in Settings opens /legal/privacy', async () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ProfileScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  const row = findAll(tree, (p) => p.accessibilityRole === 'button' && p.accessibilityLabel === en.profile.privacyPolicy)[0];
  expect(row).toBeDefined();
  jest.mocked(router.push).mockClear();
  await act(async () => {
    row.props.onPress();
  });
  expect(router.push).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledWith('/legal/privacy');
});
