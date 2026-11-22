// PHASE3_ROWS.md row 9, Settings side: the "Export my data" row on the main
// Settings list (src/app/profile/index.tsx). It renders for every user with its
// localised label and VoiceOver hint, one press calls the export helper once,
// and the share sheet receives the returned JSON.
import { Share } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import ProfileScreen from '@/app/profile/index';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

const mockExport = jest.fn();

jest.mock('@/lib/api', () => ({
  api: { profile: { export: (...args: unknown[]) => mockExport(...args) } },
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

const EXPORT = { exported_for: 'user_1', food_logs: [{ food_name: 'Oats' }] };

let shareSpy: jest.SpyInstance;

beforeEach(() => {
  mockExport.mockReset().mockResolvedValue(EXPORT);
  shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
});

afterEach(() => shareSpy.mockRestore());

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

const exportRow = (tree: Awaited<ReturnType<typeof render>>) =>
  findAll(tree, (p) => p.accessibilityRole === 'button' && p.accessibilityLabel === en.settings.exportTitle)[0];

test('the export row renders with its label and VoiceOver hint', async () => {
  const row = exportRow(await render());
  expect(row).toBeDefined();
  expect(row.props.accessibilityHint).toBe(en.settings.exportHint);
});

test('pressing the row calls the export helper once and shares the returned JSON', async () => {
  const tree = await render();
  await act(async () => {
    exportRow(tree).props.onPress();
  });
  expect(mockExport).toHaveBeenCalledTimes(1);
  expect(shareSpy).toHaveBeenCalledTimes(1);
  expect(shareSpy.mock.calls[0][0]).toEqual({ message: JSON.stringify(EXPORT, null, 2) });
});
