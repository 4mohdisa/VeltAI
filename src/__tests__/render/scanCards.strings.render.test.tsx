// PHASE3_ROWS.md row 13, Food log translation: the photo-scan cards
// (src/components/food/scan: ScanFailedCard, ScanFeedbackPrompt, ConfidenceBadge,
// ScanReviewCard) and the custom food form (src/app/food/custom-food.tsx) read
// their copy from the scanCards and customFood blocks (plus reused keys) in
// en, es and fr. Network mocked.
import CustomFoodScreen from '@/app/food/custom-food';
import { ConfidenceBadge } from '@/components/food/scan/ConfidenceBadge';
import { ScanFailedCard } from '@/components/food/scan/ScanFailedCard';
import { ScanFeedbackPrompt } from '@/components/food/scan/ScanFeedbackPrompt';
import { ScanReviewCard, type ReviewItem } from '@/components/food/scan/ScanReviewCard';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/api', () => ({
  api: {
    foodLogs: { portionMemory: () => Promise.resolve({ found: true, typical_weight_g: 180 }) },
    scan: { calibration: () => Promise.resolve({ factors: [] }) },
  },
}));

type Locale = typeof es; // en also has English-only keys, so es is the shape every locale shares
const LOCALES: [string, Locale][] = [
  ['en', en],
  ['es', es],
  ['fr', fr],
];

const fill = (s: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((out, [k, v]) => out.replace(`{{${k}}}`, String(v)), s);

const labels = (tree: ReturnType<typeof renderScreen>, prop: string) =>
  new Set(findAll(tree, (p) => typeof p[prop] === 'string').map((n) => n.props[prop] as string));

const item: ReviewItem = {
  id: 'i1',
  name: 'Rice',
  estimatedWeightG: 200,
  weightG: 200,
  confidence: 90,
  scanSessionId: 's1',
  calories: 260,
  protein: 5,
  carbs: 56,
  fat: 1,
  needsConfirmation: true,
  alternateWeightG: 150,
  matchedMealName: 'Rice bowl',
  matchedMealWeightG: 220,
};

async function inLocale(lng: string) {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
}

afterEach(async () => {
  await inLocale('en');
});

test.each(LOCALES)('%s: ScanFailedCard and ScanFeedbackPrompt copy', async (lng, l) => {
  await inLocale(lng);
  const failed = renderScreen(<ScanFailedCard onLogManually={() => {}} onDiscard={() => {}} />);
  const text = allText(failed);
  expect(text).toContain(l.scanCards.failedTitle);
  expect(text).toContain(l.scanCards.failedMessage);
  expect(text).toContain(l.gymSession.discard);
  expect(labels(failed, 'accessibilityLabel')).toContain(l.scanCards.logManually);

  const prompt = renderScreen(<ScanFeedbackPrompt onRate={() => {}} onDismiss={() => {}} />);
  const promptText = allText(prompt);
  for (const key of ['feedbackQuestion', 'wayOff', 'aBitOff', 'prettyGood', 'spotOn'] as const) {
    expect(promptText).toContain(l.scanCards[key]);
  }
});

test.each(LOCALES)('%s: ConfidenceBadge band, toggle and its label', async (lng, l) => {
  await inLocale(lng);
  const tree = renderScreen(<ConfidenceBadge score={90} label="High" />);
  expect(allText(tree)).toContain(l.labelScan.confidenceHigh);
  expect(allText(tree)).toContain(l.scanCards.why);
  const toggle = findAll(tree, (p) => p.accessibilityLabel === l.scanCards.whyLabel && typeof p.onPress === 'function')[0];
  await act(async () => {
    (toggle.props.onPress as () => void)();
  });
  expect(allText(tree)).toContain(l.gymSession.hide);
  expect(labels(tree, 'accessibilityLabel')).toContain(l.scanCards.hideBreakdown);
});

test.each(LOCALES)('%s: ScanReviewCard copy and labels', async (lng, l) => {
  await inLocale(lng);
  const tree = renderScreen(
    <ScanReviewCard items={[item]} onWeightChange={() => {}} onDiscard={() => {}} onSaveAll={() => {}} />,
  );
  await act(async () => {
    await Promise.resolve();
  });
  const text = allText(tree);
  const s = l.scanCards;
  expect(text).toContain(s.reviewTitle);
  expect(text).toContain(s.anglesDisagree);
  expect(text).toContain(fill(s.topView, { grams: 200 }));
  expect(text).toContain(fill(s.sideView, { grams: 150 }));
  expect(text).toContain(JSON.stringify(fill(s.usualPortion, { name: 'Rice bowl', grams: 220 })).slice(1, -1));
  expect(text).toContain(fill(l.labelScan.totalKcal, { kcal: 260 }));
  expect(text).toContain(fill(s.typical, { grams: 180 }));
  expect(text).toContain(s.saveAll);
  expect(text).toContain(l.gymSession.discard);

  const a11y = labels(tree, 'accessibilityLabel');
  expect(a11y).toContain(fill(s.keepGrams, { grams: 200 }));
  expect(a11y).toContain(fill(s.useGrams, { grams: 150 }));
  expect(a11y).toContain(fill(s.usualPortionLabel, { name: 'Rice bowl' }));
  expect(a11y).toContain(fill(s.renameLabel, { name: 'Rice' }));
  expect(a11y).toContain(fill(s.multLabel, { mult: '2×' }));
  expect(labels(tree, 'accessibilityHint')).toContain(s.renameHint);
  expect(labels(tree, 'label')).toContain(s.weight);
});

test('ScanReviewCard: agreeing angles show the translated agreement line', async () => {
  await inLocale('fr');
  const tree = renderScreen(
    <ScanReviewCard
      items={[{ ...item, needsConfirmation: false, angleAgreement: 0.92 }]}
      onWeightChange={() => {}}
      onDiscard={() => {}}
      onSaveAll={() => {}}
    />,
  );
  expect(allText(tree)).toContain(fill(fr.scanCards.anglesAgree, { percent: 92 }));
});

test.each(LOCALES)('%s: custom food form labels, placeholder and error', async (lng, l) => {
  await inLocale(lng);
  const tree = renderScreen(<CustomFoodScreen />);
  expect(allText(tree)).toContain(l.customFood.title);
  const fieldLabels = labels(tree, 'label');
  for (const v of [l.food.nameField, l.customFood.caloriesLabel, l.labelScan.protein, l.labelScan.carbs, l.labelScan.fat, l.labelScan.fibre]) {
    expect(fieldLabels).toContain(v);
  }
  const placeholders = labels(tree, 'placeholder');
  expect(placeholders).toContain(l.customFood.namePlaceholder);
  expect(placeholders).toContain(l.dashboard.kcal);

  const calories = findAll(tree, (p) => p.label === l.customFood.caloriesLabel && typeof p.onChangeText === 'function')[0];
  act(() => {
    (calories.props.onChangeText as (v: string) => void)('0');
  });
  expect(allText(tree)).toContain(l.customFood.calorieError);
});
