// PHASE3_ROWS.md row 8, step 2b: the analytics switch on the Privacy settings
// screen (src/app/profile/privacy.tsx). It renders with its localised label and
// VoiceOver hint, starts off, and toggling it calls the store's
// setAnalyticsEnabled with the new value.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import PrivacyScreen from '@/app/profile/privacy';
import en from '@/lib/i18n/locales/en.json';
import { useSettingsStore } from '@/lib/settings/store';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/ai/consent', () => ({
  hasAiConsent: jest.fn().mockResolvedValue(false),
  revokeAiConsent: jest.fn(),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const mockSetAnalyticsEnabled = jest.fn((analyticsEnabled: boolean) => {
  useSettingsStore.setState({ analyticsEnabled });
});

beforeEach(() => {
  mockSetAnalyticsEnabled.mockClear();
  useSettingsStore.setState({ analyticsEnabled: false, setAnalyticsEnabled: mockSetAnalyticsEnabled });
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

const analyticsSwitch = (tree: Awaited<ReturnType<typeof render>>) => {
  const [node] = findAll(tree, (p) => p.accessibilityRole === 'switch' && p.accessibilityLabel === en.settings.analyticsLabel);
  return node;
};

test('the analytics switch renders off, with its label and hint', async () => {
  const tree = await render();
  const node = analyticsSwitch(tree);
  expect(node).toBeDefined();
  expect(node.props.value).toBe(false);
  expect(node.props.accessibilityHint).toBe(en.settings.analyticsHint);
  expect(allText(tree)).toContain(JSON.stringify(en.settings.analyticsLabel));
});

test('toggling the switch calls setAnalyticsEnabled with true, then false', async () => {
  const tree = await render();
  await act(async () => {
    analyticsSwitch(tree).props.onValueChange(true);
  });
  await act(async () => {
    analyticsSwitch(tree).props.onValueChange(false);
  });
  expect(mockSetAnalyticsEnabled.mock.calls).toEqual([[true], [false]]);
});
