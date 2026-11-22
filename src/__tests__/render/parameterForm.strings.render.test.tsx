// PHASE3_ROWS.md row 14, ParameterForm (src/components/gym/ParameterForm.tsx),
// the session screen's live calorie preview: Calculating, Preview unavailable,
// the kcal estimate, How is this calculated? and the MET and confidence caption
// read from the parameterForm block in en, es and fr. Network mocked.
import { ParameterForm } from '@/components/gym/ParameterForm';
import type { CalorieResult, ParameterSchema } from '@/lib/api';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, findAll, renderScreen } from './helpers';

const mockLastLogged = jest.fn();
const mockPreviewCalories = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    gym: {
      lastLogged: (...args: unknown[]) => mockLastLogged(...args),
      previewCalories: (...args: unknown[]) => mockPreviewCalories(...args),
    },
  },
}));

const schema: ParameterSchema = {
  fields: [{ key: 'minutes', label: 'Minutes', type: 'number', required: true, default: 30 }],
  calorie_formula: 'met',
};

const result: CalorieResult = {
  calories: 212.4,
  computed_met: 7,
  formula: 'met',
  inputs: { minutes: 30 },
  confidence: 'medium',
  explanation: 'MET x weight x hours',
};

async function render(lng: string) {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tree = renderScreen(<ParameterForm exerciseId="ex1" schema={schema} onParamsChange={() => {}} />);
  await act(async () => {
    jest.advanceTimersByTime(400);
  });
  for (let i = 0; i < 3; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  return tree;
}

beforeEach(() => {
  jest.useFakeTimers();
  mockLastLogged.mockResolvedValue({ parameters: null });
});

afterEach(async () => {
  jest.useRealTimers();
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('shows Calculating while the first preview is in flight', async () => {
  mockPreviewCalories.mockReturnValue(new Promise(() => {}));
  const tree = await render('en');
  expect(allText(tree)).toContain(en.parameterForm.calculating);
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: estimate, explain toggle and MET caption come from the locale', async (lng, locale) => {
  mockPreviewCalories.mockResolvedValue(result);
  const tree = await render(lng);
  const text = allText(tree);
  expect(text).toContain(locale.parameterForm.estimate.replace('{{kcal}}', '212'));
  expect(text).toContain(locale.parameterForm.howCalculated);

  const toggle = findAll(tree, (p) => p.accessibilityLabel === locale.parameterForm.howCalculated && typeof p.onPress === 'function')[0];
  expect(toggle).toBeDefined();
  await act(async () => {
    (toggle.props.onPress as () => void)();
  });
  const caption = locale.parameterForm.metConfidence
    .replace('{{met}}', '7')
    .replace('{{confidence}}', locale.parameterForm.confidenceMedium);
  expect(allText(tree)).toContain(caption);
});

test('fr: a failed preview shows the translated unavailable copy', async () => {
  mockPreviewCalories.mockRejectedValue(new Error('offline'));
  const tree = await render('fr');
  expect(allText(tree)).toContain(fr.parameterForm.previewUnavailable);
  expect(allText(tree)).not.toContain('Preview unavailable');
});
