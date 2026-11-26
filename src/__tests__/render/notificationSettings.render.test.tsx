// Row 10b part 2: the Notifications group on Settings
// (src/components/domain/NotificationSettingsList.tsx, mounted in
// src/app/profile/index.tsx). Each switch shows its saved value, a toggle is
// saved on the device, promotional starts off, and quiet hours show the saved
// times. Storage is an in-memory map.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { NotificationSettingsList } from '@/components/domain/NotificationSettingsList';
import en from '@/lib/i18n/locales/en.json';
import { DEFAULT_NOTIFICATION_SETTINGS, type NotificationSettings } from '@/lib/notifications/types';
import { useSettingsStore } from '@/lib/settings/store';
import { act, findAll, renderScreen } from './helpers';

const mockStored = new Map<string, string>();
jest.mock('@/lib/storage/secureStore', () => ({
  ...jest.requireActual('@/lib/storage/secureStore'),
  getItem: async (key: string) => mockStored.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    mockStored.set(key, value);
    return true;
  },
}));

const KEY = 'lume.notificationSettings';
const N = en.notifications;
const CATEGORIES = ['meal_reminder', 'workout_reminder', 'streak_at_risk', 'weekly_summary'] as const;
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

async function render() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <NotificationSettingsList />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

type Tree = Awaited<ReturnType<typeof render>>;

const switchFor = (tree: Tree, label: string) =>
  findAll(tree, (p) => p.accessibilityRole === 'switch' && p.accessibilityLabel === label)[0];
const isOn = (tree: Tree, label: string) => switchFor(tree, label).props.value as boolean;
const saved = () => JSON.parse(mockStored.get(KEY) ?? 'null') as NotificationSettings | null;

beforeEach(() => {
  mockStored.clear();
  useSettingsStore.getState().reset();
});

test('there is one switch per category, under the Notifications title', async () => {
  const tree = await render();
  expect(JSON.stringify(tree.toJSON())).toContain(en.settings.notifications);
  for (const c of [...CATEGORIES, 'promotional'] as const) expect(switchFor(tree, N[c].label)).toBeDefined();
});

test('promotional is off by default and the other categories are on', async () => {
  const tree = await render();
  expect(isOn(tree, N.promotional.label)).toBe(false);
  for (const c of CATEGORIES) expect(isOn(tree, N[c].label)).toBe(true);
});

test('each switch reads its saved value', async () => {
  mockStored.set(
    KEY,
    JSON.stringify({
      enabled: { meal_reminder: false, workout_reminder: true, streak_at_risk: false, weekly_summary: true },
      quietHours: DEFAULT_NOTIFICATION_SETTINGS.quietHours,
      promotionalOptIn: true,
    }),
  );
  const tree = await render();
  expect(isOn(tree, N.meal_reminder.label)).toBe(false);
  expect(isOn(tree, N.workout_reminder.label)).toBe(true);
  expect(isOn(tree, N.streak_at_risk.label)).toBe(false);
  expect(isOn(tree, N.weekly_summary.label)).toBe(true);
  expect(isOn(tree, N.promotional.label)).toBe(true);
});

test.each(CATEGORIES)('turning %s off is saved and leaves the others alone', async (category) => {
  const tree = await render();
  await act(async () => {
    switchFor(tree, N[category].label).props.onValueChange(false);
  });
  expect(isOn(tree, N[category].label)).toBe(false);
  expect(saved()?.enabled).toEqual({ ...DEFAULT_NOTIFICATION_SETTINGS.enabled, [category]: false });
  expect(saved()?.promotionalOptIn).toBe(false);
});

test('opting in to promotional is saved as its own choice', async () => {
  const tree = await render();
  await act(async () => {
    switchFor(tree, N.promotional.label).props.onValueChange(true);
  });
  expect(isOn(tree, N.promotional.label)).toBe(true);
  expect(saved()).toEqual({ ...DEFAULT_NOTIFICATION_SETTINGS, promotionalOptIn: true });
});

test('a saved promotional value that is not true reads as off', async () => {
  mockStored.set(KEY, JSON.stringify({ promotionalOptIn: 'yes' }));
  const tree = await render();
  expect(isOn(tree, N.promotional.label)).toBe(false);
});

test('quiet hours show the default and the saved times', async () => {
  const value = (start: string, end: string) => N.quietHours.value.replace('{{start}}', start).replace('{{end}}', end);
  expect(JSON.stringify((await render()).toJSON())).toContain(value('22:00', '07:00'));

  mockStored.set(KEY, JSON.stringify({ ...DEFAULT_NOTIFICATION_SETTINGS, quietHours: { start: 21 * 60 + 30, end: 6 * 60 } }));
  const text = JSON.stringify((await render()).toJSON());
  expect(text).toContain(N.quietHours.label);
  expect(text).toContain(value('21:30', '06:00'));
});
