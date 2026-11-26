// Thinking of leaving (src/app/profile/leaving.tsx, Row 9). The summary comes
// from api.retention.summary (mocked here): a skeleton while it loads, an error
// with Try again, an empty state for a user with nothing logged, and the three
// counts otherwise. One reason at a time, an optional note, Keep my plan goes back.
import { router } from 'expo-router';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import LeavingScreen from '@/app/profile/leaving';
import type { RetentionSummary } from '@/lib/api';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

const mockSummary = jest.fn<Promise<RetentionSummary>, []>();
jest.mock('@/lib/api', () => ({ api: { retention: { summary: () => mockSummary() } } }));
// Skeleton needs reanimated's useReducedMotion, which this render environment
// lacks (same stand-in as gymStreakStripFootnote.render.test.tsx).
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};
const L = en.subscription.leaving;
const SUMMARY: RetentionSummary = { meals_last_30_days: 1234, workouts_last_30_days: 14, current_streak_days: 6 };

const settle = () =>
  act(async () => {
    await new Promise((r) => setImmediate(r));
  });

async function render() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <LeavingScreen />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
}

type Tree = Awaited<ReturnType<typeof render>>;

const chip = (tree: Tree, label: string) =>
  findAll(tree, (p) => p.accessibilityLabel === label && p.accessibilityRole === 'checkbox')[0];
const checkedReasons = (tree: Tree) =>
  Object.values(L.reasons).filter((label) => chip(tree, label).props.accessibilityState.checked);
const tap = (tree: Tree, label: string) =>
  act(async () => {
    chip(tree, label).props.onPress();
  });

beforeEach(() => {
  mockSummary.mockReset().mockResolvedValue(SUMMARY);
});

test('shows a skeleton while the summary loads', async () => {
  mockSummary.mockReturnValue(new Promise(() => {}));
  const tree = await render();
  expect(findAll(tree, (p) => p.testID === 'leaving-loading')).not.toHaveLength(0);
  expect(allText(tree)).not.toContain(L.meals);
});

test('shows the real counts from the summary', async () => {
  const text = allText(await render());
  for (const s of [L.title, L.usageTitle, L.meals, L.workouts, L.streak, '1,234', '14', '6']) expect(text).toContain(s);
  expect(text).not.toContain(L.emptyTitle);
});

test('a user with nothing logged sees the empty state, not zeros', async () => {
  mockSummary.mockResolvedValue({ meals_last_30_days: 0, workouts_last_30_days: 0, current_streak_days: 0 });
  const text = allText(await render());
  expect(text).toContain(L.emptyTitle);
  expect(text).toContain(L.emptyBody);
  expect(text).not.toContain(L.meals);
});

test('a failed load shows an error, and Try again loads the counts', async () => {
  mockSummary.mockRejectedValueOnce(new Error('offline'));
  const tree = await render();
  expect(allText(tree)).toContain(en.errorState.title);
  expect(allText(tree)).not.toContain(L.meals);

  await act(async () => {
    buttonWithTitle(tree, L.tryAgain)!.props.onPress();
  });
  await settle();
  expect(mockSummary).toHaveBeenCalledTimes(2);
  expect(allText(tree)).toContain(L.meals);
  expect(allText(tree)).not.toContain(en.errorState.title);
});

test('the reason survey allows one choice at a time', async () => {
  const tree = await render();
  expect(checkedReasons(tree)).toEqual([]);
  await tap(tree, L.reasons.too_expensive);
  expect(checkedReasons(tree)).toEqual([L.reasons.too_expensive]);
  await tap(tree, L.reasons.not_working);
  expect(checkedReasons(tree)).toEqual([L.reasons.not_working]);
  await tap(tree, L.reasons.not_working);
  expect(checkedReasons(tree)).toEqual([]);
});

test('the note is optional and keeps what the user types', async () => {
  const tree = await render();
  const note = () => findAll(tree, (p) => p.accessibilityLabel === L.noteLabel && 'onChangeText' in p)[0];
  expect(note().props.value).toBe('');
  await act(async () => {
    note().props.onChangeText('Need a family plan');
  });
  expect(note().props.value).toBe('Need a family plan');
  expect(buttonWithTitle(tree, L.keepPlan)!.props.disabled).toBeFalsy();
});

test('Keep my plan goes back', async () => {
  const tree = await render();
  await act(async () => {
    buttonWithTitle(tree, L.keepPlan)!.props.onPress();
  });
  expect(router.back).toHaveBeenCalled();
});
