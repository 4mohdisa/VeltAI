// Row 14 · The in-app Privacy Policy renders from legal.privacy in en.json: every
// section heading, the processor lines, analytics off by default, and a back
// control that goes back. The screen is static, so it has one data state.
import { router } from 'expo-router';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import PrivacyPolicyScreen from '@/app/legal/privacy';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, findAll, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};
const P = en.legal.privacy;

const render = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PrivacyPolicyScreen />
    </SafeAreaProvider>,
  );

test('renders the title and every section heading, numbered in order', () => {
  const text = allText(render());
  expect(text).toContain(P.title);
  Object.values(P.sections).forEach(({ heading }, i) => expect(text).toContain(`${i + 1}. ${heading}`));
});

test('names Google for photo scans, Anthropic only as the backup, and PostHog only when analytics is on', () => {
  const text = allText(render());
  const [, gemini, , posthog] = P.sections.disclosure.body;
  expect(text).toContain(gemini);
  expect(gemini).toMatch(/Google Gemini receives the photograph/);
  expect(gemini).toMatch(/Anthropic receives that summary instead only if/);
  expect(text).toContain(posthog);
  expect(posthog).toMatch(/PostHog .* only when you have turned analytics on/);
});

test('says product analytics is off by default', () => {
  expect(allText(render())).toContain(P.sections.analytics.body[0]);
  expect(P.sections.analytics.body[0]).toMatch(/^Product analytics is off by default\./);
});

test('the back control goes back', () => {
  const tree = render();
  const back = findAll(tree, (p) => p.accessibilityLabel === en.common.goBack && typeof p.onPress === 'function')[0];
  act(() => back.props.onPress());
  expect(router.back).toHaveBeenCalled();
});
