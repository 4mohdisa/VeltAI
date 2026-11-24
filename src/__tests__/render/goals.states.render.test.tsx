// PHASE4_ROWS.md row 2.4 (and row 15), Goals screen (src/app/profile/goals.tsx)
// read states. @/lib/api is mocked at the boundary, so the real useGoals runs.
// In en, es and fr: a read still running shows no targets card and no notice; a
// failed read shows the load failure and its Retry reads again; a read with data
// shows the server's targets.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import GoalsScreen from '@/app/profile/goals';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { useSettingsStore } from '@/lib/settings/store';
import { act, allText, findAll, renderScreen } from './helpers';

const mockGetGoals = jest.fn();
jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, api: { ...actual.api, goals: { get: (...args: unknown[]) => mockGetGoals(...args) } } };
});

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonCard: () => null,
  SkeletonList: () => null,
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

async function renderGoals() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <GoalsScreen />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
}

beforeEach(() => {
  useSettingsStore.getState().reset();
  mockGetGoals.mockReset();
});

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

describe.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s', (lang, locale) => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage(lang);
    });
  });

  test('while the read runs, neither the targets card nor the notice shows', async () => {
    mockGetGoals.mockReturnValue(new Promise(() => {}));
    const text = allText(await renderGoals());
    expect(text).not.toContain(locale.goals.dailyCalories);
    expect(text).not.toContain(locale.goals.loadFailed);
  });

  test('a failed read shows the load failure and Retry reads again', async () => {
    mockGetGoals.mockRejectedValue(new Error('Network request failed'));
    const tree = await renderGoals();
    expect(allText(tree)).toContain(locale.goals.loadFailed);
    expect(mockGetGoals).toHaveBeenCalledTimes(1);

    const retry = findAll(tree, (p) => p.accessibilityLabel === locale.common.tryAgain && typeof p.onPress === 'function')[0];
    expect(retry).toBeDefined();
    await act(async () => {
      (retry.props.onPress as () => void)();
    });
    await settle();
    expect(mockGetGoals).toHaveBeenCalledTimes(2);
  });

  test('a read with data shows the server targets', async () => {
    mockGetGoals.mockResolvedValue({ calorie_target: 2345, protein_target: 151, carb_target: 222, fat_target: 77, fibre_target: 31 });
    const tree = await renderGoals();
    const text = allText(tree);
    expect(text).toContain(locale.goals.dailyCalories);
    expect(text).not.toContain(locale.goals.loadFailed);
    const values = findAll(tree, (p) => typeof p.value === 'string').map((n) => n.props.value as string);
    expect(values).toEqual(expect.arrayContaining(['2345', '151', '222', '77', '31']));
  });
});
