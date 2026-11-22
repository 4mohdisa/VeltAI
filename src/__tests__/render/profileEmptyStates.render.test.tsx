// PHASE3_ROWS.md row 16, Profile empty states (EMPTY_STATES_AUDIT.md "Profile"):
// the streak cards wait for the gym read, Account fills a name that lands after
// mount, Privacy survives a failed consent read, Scan accuracy shows a failure
// rather than "No scans yet" and counts scans that were never corrected, and the
// Support email row reports a Mail failure.
import { Linking } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import ProfileScreen from '@/app/profile/index';
import AccountScreen from '@/app/profile/account';
import PrivacyScreen from '@/app/profile/privacy';
import ScanCalibrationScreen from '@/app/profile/scan-calibration';
import SupportScreen from '@/app/profile/support';
import { showToast } from '@/components/display/toastStore';
import { api } from '@/lib/api';
import { hasAiConsent } from '@/lib/ai/consent';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, findAll, renderScreen } from './helpers';

// The loading Skeletons need reanimated's useReducedMotion, which this render
// environment does not provide (see scanCalibrationLocale.render.test.tsx).
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));
jest.mock('@/components/display', () => ({
  ...jest.requireActual('@/components/display'),
  Skeleton: () => null,
}));
jest.mock('@/components/display/toastStore', () => ({ showToast: jest.fn() }));

let mockProfileName = '';
let mockGymLoading = false;
jest.mock('@/lib/data', () => ({
  useUserProfile: () => ({ name: mockProfileName, email: 'sam@example.test' }),
  useGym: () => ({
    data: { streak: { current: 4, longest: 9, totalGymDays: 21, freezesAvailable: 1 } },
    isLoading: mockGymLoading,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/lib/api', () => ({
  api: { scan: { calibration: jest.fn() }, profile: { export: jest.fn(), update: jest.fn() } },
}));
jest.mock('@/lib/ai/consent', () => ({ hasAiConsent: jest.fn(), revokeAiConsent: jest.fn() }));
jest.mock('@/components/domain/StreakCounter', () => ({ StreakCounter: () => null }));
jest.mock('@/lib/auth/appState', () => ({ useAppState: () => ({ dispatch: jest.fn() }) }));
jest.mock('@/lib/billing/purchases', () => ({
  hasProEntitlement: () => false,
  isBillingEnabled: () => false,
  restorePurchases: jest.fn(),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const calibration = api.scan.calibration as jest.Mock;
const consent = hasAiConsent as jest.Mock;
const c = en.settings.scanCalibration;

const settle = () =>
  act(async () => {
    await new Promise((r) => setImmediate(r));
  });

async function render(el: React.ReactElement) {
  const tree = renderScreen(<SafeAreaProvider initialMetrics={METRICS}>{el}</SafeAreaProvider>);
  await settle();
  return tree;
}

beforeEach(() => {
  mockProfileName = '';
  mockGymLoading = false;
  jest.clearAllMocks();
});

test('Profile: the streak stats wait for the gym read, then show the real numbers', async () => {
  mockGymLoading = true;
  expect(allText(await render(<ProfileScreen />))).not.toContain(JSON.stringify(en.profile.longest));

  mockGymLoading = false;
  const text = allText(await render(<ProfileScreen />));
  expect(text).toContain(JSON.stringify(en.profile.longest));
  expect(text).toContain('21');
});

test('Account: a name that loads after mount fills the field', async () => {
  const tree = await render(<AccountScreen />);
  mockProfileName = 'Sam';
  await act(async () => {
    tree.update(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AccountScreen />
      </SafeAreaProvider>,
    );
  });
  const field = findAll(tree, (p) => p.label === en.settings.accountDetails.displayName)[0];
  expect(field.props.value).toBe('Sam');
});

test('Privacy: a failed consent read still offers the withdraw control', async () => {
  consent.mockRejectedValue(new Error('storage unavailable'));
  expect(allText(await render(<PrivacyScreen />))).toContain(JSON.stringify(en.settings.privacyDetails.aiTitle));
});

test('Scan accuracy: a failed read shows a failure with Retry, not "No scans yet"', async () => {
  calibration.mockRejectedValueOnce(new Error('network request failed'));
  calibration.mockResolvedValueOnce({ accuracy_summary: null, factors: [] });
  const tree = await render(<ScanCalibrationScreen />);
  const text = allText(tree);
  expect(text).toContain(c.loadFailed);
  expect(text).not.toContain(c.emptyTitle);

  const retry = findAll(tree, (p) => p.title === en.errorState.retry && typeof p.onPress === 'function')[0];
  await act(async () => {
    (retry.props.onPress as () => void)();
  });
  await settle();
  expect(calibration).toHaveBeenCalledTimes(2);
  expect(allText(tree)).toContain(c.emptyTitle);
});

test('Scan accuracy: scans with no corrections show the stats, not "No scans yet"', async () => {
  calibration.mockResolvedValue({
    accuracy_summary: { total_scans: 5, corrected_count: 0, avg_correction_magnitude: 0, most_underestimated: [], most_overestimated: [] },
    factors: [],
  });
  const text = allText(await render(<ScanCalibrationScreen />));
  expect(text).toContain(c.scansLogged);
  expect(text).not.toContain(c.emptyTitle);
});

test('Support: the Email support row reports a Mail failure', async () => {
  jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no mail app'));
  const tree = await render(<SupportScreen />);
  const row = findAll(tree, (p) => p.accessibilityLabel !== undefined && String(p.accessibilityLabel).includes(en.support.emailSupport) && typeof p.onPress === 'function')[0];
  await act(async () => {
    (row.props.onPress as () => void)();
  });
  await settle();
  expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ tone: 'error' }));
});
