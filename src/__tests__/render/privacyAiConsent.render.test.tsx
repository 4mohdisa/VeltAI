// PHASE4_ROWS.md row 5b: the AI processing switch on the Privacy screen
// (src/app/profile/privacy.tsx). On shows when consent was given; turning it
// off withdraws through revokeAiConsent; turning it on opens /ai-consent. The
// consent helper and the API client are mocked; no network.
import { router } from 'expo-router';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import PrivacyScreen from '@/app/profile/privacy';
import { useToastStore } from '@/components/display/toastStore';
import { hasAiConsent, revokeAiConsent } from '@/lib/ai/consent';
import { formatLongDate } from '@/lib/formatting';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, findAll, renderScreen } from './helpers';

const mockGetConsent = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { ai: { getConsent: (...args: unknown[]) => mockGetConsent(...args) }, profile: { export: jest.fn() } },
}));

jest.mock('@/lib/ai/consent', () => ({
  hasAiConsent: jest.fn(),
  revokeAiConsent: jest.fn(),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const CONSENTED_AT = '2026-11-20T10:00:00Z';
const copy = en.settings.privacyDetails;
const consent = hasAiConsent as jest.Mock;
const revoke = revokeAiConsent as jest.Mock;

beforeEach(() => {
  consent.mockReset();
  revoke.mockReset();
  mockGetConsent.mockReset();
  useToastStore.getState().dismiss();
});

async function render() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PrivacyScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

type Tree = Awaited<ReturnType<typeof render>>;
const aiSwitch = (tree: Tree) =>
  findAll(tree, (p) => p.accessibilityRole === 'switch' && p.accessibilityLabel === copy.aiAllow)[0];

const toggle = async (tree: Tree, on: boolean) => {
  await act(async () => {
    (aiSwitch(tree).props.onValueChange as (v: boolean) => void)(on);
    await new Promise((r) => setImmediate(r));
  });
};

const givenText = copy.aiConsentedOn.replace('{{date}}', formatLongDate(new Date(CONSENTED_AT)));

test('consent on: the switch is on and shows when consent was given', async () => {
  consent.mockResolvedValue(true);
  mockGetConsent.mockResolvedValue({ consented: true, consented_at: CONSENTED_AT });
  const tree = await render();

  expect(aiSwitch(tree).props.value).toBe(true);
  expect(allText(tree)).toContain(givenText);
});

test('consent off: the switch is off, shows no date, and turning it on opens /ai-consent', async () => {
  consent.mockResolvedValue(false);
  mockGetConsent.mockResolvedValue({ consented: false, consented_at: null });
  const tree = await render();

  expect(aiSwitch(tree).props.value).toBe(false);
  expect(allText(tree)).not.toContain(givenText);

  await toggle(tree, true);
  expect(router.push).toHaveBeenCalledWith('/ai-consent');
  expect(revoke).not.toHaveBeenCalled();
});

test('while the withdraw request is in flight, the row says so and a second toggle sends nothing', async () => {
  consent.mockResolvedValue(true);
  mockGetConsent.mockResolvedValue({ consented: true, consented_at: CONSENTED_AT });
  revoke.mockReturnValue(new Promise(() => {}));
  const tree = await render();

  await toggle(tree, false);
  expect(allText(tree)).toContain(copy.aiTurningOff);
  await toggle(tree, false);
  expect(revoke).toHaveBeenCalledTimes(1);
});

test('a failed withdraw shows the error message and leaves the switch on', async () => {
  consent.mockResolvedValue(true);
  mockGetConsent.mockResolvedValue({ consented: true, consented_at: CONSENTED_AT });
  revoke.mockRejectedValue(new Error('offline'));
  const tree = await render();

  await toggle(tree, false);
  expect(useToastStore.getState().current).toMatchObject({ message: copy.aiTurnOffFailed, tone: 'error' });
  expect(aiSwitch(tree).props.value).toBe(true);
  expect(allText(tree)).toContain(givenText);
});

test('a successful withdraw turns the switch off and clears the date', async () => {
  consent.mockResolvedValue(true);
  mockGetConsent.mockResolvedValue({ consented: true, consented_at: CONSENTED_AT });
  revoke.mockResolvedValue(undefined);
  const tree = await render();

  await toggle(tree, false);
  expect(revoke).toHaveBeenCalledTimes(1);
  expect(aiSwitch(tree).props.value).toBe(false);
  expect(allText(tree)).not.toContain(givenText);
  expect(useToastStore.getState().current).toMatchObject({ message: copy.aiTurnedOff, tone: 'success' });
});
