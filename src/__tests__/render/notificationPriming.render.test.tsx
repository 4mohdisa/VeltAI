// Row 10b: the reminders priming sheet (src/components/domain/NotificationPriming.tsx).
// It appears once a meal is logged, never for someone who already answered, and
// only "Turn on reminders" reaches the system prompt (the permissions wrapper,
// mocked here). Each answer is stored so the sheet never comes back, and a grant
// reschedules today's reminders through the daily run (daily.ts, mocked here).
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { NotificationPriming } from '@/components/domain/NotificationPriming';
import { useFoodStore, type StoredMeal } from '@/lib/data/foodStore';
import en from '@/lib/i18n/locales/en.json';
import { rescheduleToday } from '@/lib/notifications/daily';
import { requestNotificationPermission } from '@/lib/notifications/permissions';
import { registerPushToken } from '@/lib/notifications/pushToken';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

jest.mock('@/lib/notifications/permissions', () => ({ requestNotificationPermission: jest.fn() }));
jest.mock('@/lib/notifications/daily', () => ({ rescheduleToday: jest.fn() }));
jest.mock('@/lib/notifications/pushToken', () => ({ registerPushToken: jest.fn(async () => undefined) }));
// The render helpers reach the sign-out purge, which imports device.ts; mocked so expo-notifications never loads.
jest.mock('@/lib/notifications/device', () => ({ clearReminders: jest.fn() }));

const mockStored = new Map<string, string>();
jest.mock('@/lib/storage/secureStore', () => ({
  ...jest.requireActual('@/lib/storage/secureStore'),
  getItem: async (key: string) => mockStored.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    mockStored.set(key, value);
    return true;
  },
}));

// Reduce Motion unmounts the sheet as soon as it closes, so a hidden sheet leaves no text behind.
jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: () => true }));

const KEY = 'lume.notificationPrimingAnswer';
const P = en.notifications.priming;
const request = jest.mocked(requestNotificationPermission);
const reschedule = jest.mocked(rescheduleToday);
const registerToken = jest.mocked(registerPushToken);
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const settle = () =>
  act(async () => {
    await new Promise((r) => setImmediate(r));
  });

async function render() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <NotificationPriming />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
}

type Tree = Awaited<ReturnType<typeof render>>;

const logMeal = (pending = false) =>
  act(async () => {
    const meal = { slot: 'Breakfast', items: [{ id: 'item_1', name: 'Oats', pending }] } as unknown as StoredMeal;
    useFoodStore.setState({ byDate: { '2026-11-27': [meal] } });
  });

const shown = (tree: Tree) => allText(tree).includes(P.title);

const press = async (tree: Tree, title: string) => {
  await act(async () => {
    buttonWithTitle(tree, title)!.props.onPress();
  });
  await settle();
};

beforeEach(() => {
  mockStored.clear();
  useFoodStore.setState({ byDate: {} });
  request.mockReset();
  reschedule.mockReset().mockResolvedValue();
  registerToken.mockClear();
});

test('stays hidden until a meal is logged, then shows once the first one is', async () => {
  const tree = await render();
  expect(shown(tree)).toBe(false);
  await logMeal(true); // a scan still analysing is not a logged meal
  expect(shown(tree)).toBe(false);
  await logMeal();
  expect(shown(tree)).toBe(true);
  for (const s of [P.body, P.turnOn, P.notNow]) expect(allText(tree)).toContain(s);
  expect(request).not.toHaveBeenCalled();
});

test.each(['granted', 'denied', 'not_now'])('stays hidden after a meal when already answered (%s)', async (answer) => {
  mockStored.set(KEY, answer);
  const tree = await render();
  await logMeal();
  expect(shown(tree)).toBe(false);
});

test('both buttons have the same visual weight', async () => {
  const tree = await render();
  await logMeal();
  expect(buttonWithTitle(tree, P.turnOn)!.props.variant).toBe(buttonWithTitle(tree, P.notNow)!.props.variant);
});

test('Not now stores the answer, hides the sheet and never asks the system', async () => {
  const tree = await render();
  await logMeal();
  await press(tree, P.notNow);
  expect(request).not.toHaveBeenCalled();
  expect(mockStored.get(KEY)).toBe('not_now');
  expect(shown(tree)).toBe(false);
});

test.each(['granted', 'denied'] as const)('Turn on reminders asks the system once and stores %s', async (result) => {
  request.mockResolvedValue(result);
  const tree = await render();
  await logMeal();
  await press(tree, P.turnOn);
  expect(request).toHaveBeenCalledTimes(1);
  expect(mockStored.get(KEY)).toBe(result);
  expect(shown(tree)).toBe(false);
});

test('a stored answer keeps the sheet away on the next launch', async () => {
  request.mockResolvedValue('denied');
  const first = await render();
  await logMeal();
  await press(first, P.turnOn);
  const next = await render();
  expect(shown(next)).toBe(false);
});

test('granting permission on the priming sheet reschedules today\'s reminders once', async () => {
  request.mockResolvedValue('granted');
  const tree = await render();
  await logMeal();
  await press(tree, P.turnOn);
  expect(reschedule).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledTimes(1);
});

test('granting permission on the priming sheet registers the push token once', async () => {
  request.mockResolvedValue('granted');
  const tree = await render();
  await logMeal();
  await press(tree, P.turnOn);
  expect(registerToken).toHaveBeenCalledTimes(1);
});

test('denying permission on the priming sheet does not reschedule reminders', async () => {
  request.mockResolvedValue('denied');
  const tree = await render();
  await logMeal();
  await press(tree, P.turnOn);
  expect(reschedule).not.toHaveBeenCalled();
  expect(registerToken).not.toHaveBeenCalled();
});

test('Not now on the priming sheet does not reschedule reminders', async () => {
  const tree = await render();
  await logMeal();
  await press(tree, P.notNow);
  expect(reschedule).not.toHaveBeenCalled();
});

test('a failing reschedule after a grant still closes the sheet and stores the answer', async () => {
  request.mockResolvedValue('granted');
  reschedule.mockRejectedValue(new Error('schedule failed'));
  const tree = await render();
  await logMeal();
  await press(tree, P.turnOn);
  expect(reschedule).toHaveBeenCalledTimes(1);
  expect(shown(tree)).toBe(false);
  expect(mockStored.get(KEY)).toBe('granted');
});
