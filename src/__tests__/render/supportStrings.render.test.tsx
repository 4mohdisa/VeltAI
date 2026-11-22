// PHASE3_ROWS.md row 16, Support screen (src/app/profile/support.tsx).
// Rendered in Spanish and French: no English Support string is left on screen,
// and the Mail failure toast reads support.mailError from the locale file.
import { Linking } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import SupportScreen from '@/app/profile/support';
import { showToast } from '@/components/display/toastStore';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/components/display/toastStore', () => ({ showToast: jest.fn() }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const render = async (lng: string) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  return renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <SupportScreen />
    </SafeAreaProvider>,
  );
};

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

const ENGLISH = [
  en.settings.supportEyebrow,
  en.settings.support,
  en.support.emailSupport,
  en.support.appVersion,
  en.support.sendFeedback,
  en.support.feedbackPlaceholder,
];

test.each([
  ['es', es],
  ['fr', fr],
] as const)('%s: no English Support string is left, and Mail failure is translated', async (lng, locale) => {
  const tree = await render(lng);
  const text = allText(tree);

  // Quoted: the serialised tree also holds props, so match the whole text node.
  for (const value of ENGLISH) expect(text).not.toContain(JSON.stringify(value));
  expect(text).toContain(locale.support.emailSupport);
  expect(text).toContain(locale.support.sendFeedback);

  jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no mail app'));
  const row = findAll(tree, (p) => String(p.accessibilityLabel ?? '').includes(locale.support.emailSupport) && typeof p.onPress === 'function')[0];
  await act(async () => {
    (row.props.onPress as () => void)();
  });

  expect(showToast).toHaveBeenLastCalledWith({
    message: locale.support.mailError.replace('{{email}}', 'lumofit@gmail.com'),
    tone: 'error',
  });
});
