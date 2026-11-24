// Terms "Health disclaimer" paragraphs follow the app language (PHASE4_ROWS.md
// row 2b, step 1d). EXECUTES the real screen in en, es and fr.
import TermsScreen from '@/app/legal/terms';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

function renderTerms(): string {
  return allText(
    renderScreen(
      <SafeAreaProvider initialMetrics={METRICS}>
        <TermsScreen />
      </SafeAreaProvider>,
    ),
  );
}

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('en: the disclaimer paragraphs read exactly as before', () => {
  const text = renderTerms();
  expect(text).toContain(
    'Lume provides general nutrition and fitness information. It is not medical advice, it is not a medical device, and it does not diagnose, treat, cure or prevent any condition.',
  );
  expect(text).toContain(
    'If you think you may have a medical emergency, contact your doctor or your local emergency service immediately.',
  );
  expect(text).toContain(
    'Calorie and macro targets are calculated from standard published formulas using the information you provide. They are a starting point, not a prescription. You rely on the app’s estimates and insights at your own risk.',
  );
});

test.each([
  ['es', es],
  ['fr', fr],
])('%s: the disclaimer paragraphs are translated', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const text = renderTerms();
  const d = locale.legal.terms.healthDisclaimer;

  expect(d.emergency).not.toBe(en.legal.terms.healthDisclaimer.emergency);
  expect(text).toContain(`${d.notMedicalAdvice} ${d.notMedicalDevice}`);
  expect(text).toContain(`${d.consultProfessional} ${d.neverDisregard}`);
  expect(text).toContain(d.emergency);
  expect(text).toContain(`${d.targetsFormulas} ${d.targetsStartingPoint} ${d.ownRisk}`);
  expect(text).not.toContain(en.legal.terms.healthDisclaimer.emergency);
});
