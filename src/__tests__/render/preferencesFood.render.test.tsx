// Row 2b: diet and cuisine on Profile > Preferences (src/app/profile/preferences.tsx).
// Loading, load failure, saving, save failure and success, through the real
// screen with fetch mocked at the network edge.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import PreferencesScreen from '@/app/profile/preferences';
import { useToastStore } from '@/components/display/toastStore';
import { useUserStore } from '@/lib/data/userStore';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

type Init = { method?: string; body?: string };
const json = (data: unknown, status = 200) =>
  Promise.resolve({ ok: status < 300, status, json: async () => ({ data, error: status < 300 ? null : 'error' }) });

const STORED = { cuisines: ['south_asian'], dietary_requirements: ['halal'] };
let patches: Record<string, unknown>[];
const mockFetch = ({ getStatus = 200, patchStatus = 200 } = {}) =>
  jest.fn((url: string, init?: Init) => {
    if (url.includes('/api/onboarding/preferences') && init?.method === 'PATCH') {
      const body = JSON.parse(init.body ?? '{}') as Record<string, unknown>;
      patches.push(body);
      return patchStatus < 300 ? json({ ...STORED, ...body }) : json(null, patchStatus);
    }
    if (url.includes('/api/onboarding/preferences')) return getStatus < 300 ? json(STORED) : json(null, getStatus);
    return json({});
  });
const setFetch = (f: unknown) => {
  (globalThis as unknown as { fetch: unknown }).fetch = f;
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};
const render = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PreferencesScreen />
    </SafeAreaProvider>,
  );
const rowPress = (tree: ReturnType<typeof render>, label: string) =>
  findAll(tree, (p) => typeof p.accessibilityLabel === 'string' && (p.accessibilityLabel as string).startsWith(`${label},`) && typeof p.onPress === 'function')[0];
const chip = (tree: ReturnType<typeof render>, label: string) =>
  findAll(tree, (p) => p.accessibilityLabel === label && typeof p.onPress === 'function')[0];
const tap = async (node: { props: { onPress?: unknown } }) => {
  await act(async () => {
    (node.props.onPress as () => void)();
  });
  await settle();
};

// The loading test holds its read open. It is answered at teardown, so the API
// client's deadline timer is cleared before the worker exits.
const held: (() => void)[] = [];
const holdFetch = () =>
  jest.fn((url: string, init?: Init) => new Promise((resolve) => held.push(() => resolve(mockFetch()(url, init)))));

afterEach(async () => {
  held.splice(0).forEach((answer) => answer());
  await settle();
});

beforeEach(() => {
  patches = [];
  useUserStore.getState().resetProfile();
  useToastStore.getState().dismiss();
});

test('loading: the rows say so and cannot be opened yet', () => {
  setFetch(holdFetch());
  const tree = render();
  expect(allText(tree)).toContain(en.preferences.food.loading);
  expect(rowPress(tree, en.preferences.food.dietary)).toBeUndefined();
});

test('the rows show the stored diet and cuisines', async () => {
  setFetch(mockFetch());
  const tree = render();
  await settle();
  expect(allText(tree)).toContain(en.onboarding.dietary.options.halal);
  expect(allText(tree)).toContain(en.onboarding.cuisine.options.south_asian);
});

test('a failed read shows the load failure and keeps the rows closed', async () => {
  setFetch(mockFetch({ getStatus: 400 }));
  const tree = render();
  await settle();
  expect(allText(tree)).toContain(en.preferences.food.loadFailed);
  expect(rowPress(tree, en.preferences.food.cuisines)).toBeUndefined();
});

test('success: editing diet sends only the diet and shows the saved toast', async () => {
  setFetch(mockFetch());
  const tree = render();
  await settle();

  await tap(rowPress(tree, en.preferences.food.dietary));
  await tap(chip(tree, en.onboarding.dietary.options.vegan));
  await tap(buttonWithTitle(tree, en.common.save)!);
  await settle();

  expect(patches).toEqual([{ dietary_requirements: ['halal', 'vegan'] }]);
  expect(useUserStore.getState().profile.restrictions).toEqual(['halal', 'vegan']);
  expect(useToastStore.getState().current?.message).toBe(en.preferences.food.saved);
});

test('saving: Save shows its busy state while the request runs', async () => {
  let release: (v: unknown) => void = () => {};
  setFetch(
    jest.fn((url: string, init?: Init) =>
      init?.method === 'PATCH' ? new Promise((r) => (release = r)) : url.includes('/preferences') ? json(STORED) : json({}),
    ),
  );
  const tree = render();
  await settle();

  await tap(rowPress(tree, en.preferences.food.cuisines));
  await tap(chip(tree, en.onboarding.cuisine.options.western));
  await tap(buttonWithTitle(tree, en.common.save)!);

  expect(buttonWithTitle(tree, en.common.save)!.props.loading).toBe(true);
  await act(async () => {
    release({ ok: true, status: 200, json: async () => ({ data: STORED, error: null }) });
  });
  await settle();
  expect(buttonWithTitle(tree, en.common.save)?.props.loading ?? false).toBe(false);
});

test('error: a failed save keeps the stored values and shows the error toast', async () => {
  setFetch(mockFetch({ patchStatus: 400 }));
  const tree = render();
  await settle();

  await tap(rowPress(tree, en.preferences.food.cuisines));
  await tap(chip(tree, en.onboarding.cuisine.options.western));
  await tap(buttonWithTitle(tree, en.common.save)!);
  await settle();

  expect(patches).toEqual([{ cuisines: ['south_asian', 'western'] }]);
  expect(useUserStore.getState().profile.cuisines).toEqual(['south_asian']);
  expect(useToastStore.getState().current?.message).toBe(en.preferences.food.saveFailed);
});
