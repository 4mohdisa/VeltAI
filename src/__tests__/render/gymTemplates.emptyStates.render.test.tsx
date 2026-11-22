// PHASE3_ROWS.md row 14, Gym "My workouts" (src/app/gym/templates.tsx) states.
// @/lib/api is mocked at the same boundary as gymTemplates.render.test.tsx, so the
// real useTemplates hook runs. A failed read shows the LoadFailedNotice and its
// Retry re-runs the read; a successful empty read shows the empty state; the copy
// is read from en.json, then checked in Spanish.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import TemplatesScreen from '@/app/gym/templates';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, findAll, renderScreen } from './helpers';

const mockGetTemplates = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { gym: { getTemplates: (...args: unknown[]) => mockGetTemplates(...args) } },
}));

jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

async function renderTemplates() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <TemplatesScreen />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
}

type Tree = Awaited<ReturnType<typeof renderTemplates>>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;

beforeEach(() => {
  mockGetTemplates.mockReset();
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('a failed read with no templates shows the load failure and Retry runs the read again', async () => {
  mockGetTemplates.mockRejectedValue(new Error('Network request failed'));
  const tree = await renderTemplates();

  expect(hasText(tree, en.gym.loadFailed)).toBe(true);
  expect(hasText(tree, en.gymTemplates.emptyTitle)).toBe(false);
  expect(mockGetTemplates).toHaveBeenCalledTimes(1);

  const retry = findAll(tree, (p) => p.accessibilityLabel === en.common.tryAgain && typeof p.onPress === 'function')[0];
  expect(retry).toBeDefined();
  await act(async () => {
    (retry.props.onPress as () => void)();
  });
  await settle();
  expect(mockGetTemplates).toHaveBeenCalledTimes(2);
});

test('a successful read with no templates shows the empty state', async () => {
  mockGetTemplates.mockResolvedValue([]);
  const tree = await renderTemplates();

  expect(hasText(tree, en.gymTemplates.emptyTitle)).toBe(true);
  expect(hasText(tree, en.gymTemplates.emptyMessage)).toBe(true);
  expect(hasText(tree, en.gym.loadFailed)).toBe(false);
});

test('Spanish: the empty state reads from es.json', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  mockGetTemplates.mockResolvedValue([]);
  const tree = await renderTemplates();

  expect(hasText(tree, es.gymTemplates.emptyTitle)).toBe(true);
  expect(hasText(tree, es.gymTemplates.emptyMessage)).toBe(true);
});
