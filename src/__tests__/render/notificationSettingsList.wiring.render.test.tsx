// Row 10: a Settings notification switch or a quiet hours change saves, then
// reschedules the device's reminders only when permission is already granted.
// It never asks for permission. device.ts and permissions.ts are mocked;
// storage is an in-memory map.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { NotificationSettingsList } from '@/components/domain/NotificationSettingsList';
import en from '@/lib/i18n/locales/en.json';
import { applySchedule, notificationPermission } from '@/lib/notifications/device';
import { requestNotificationPermission } from '@/lib/notifications/permissions';
import { useSettingsStore } from '@/lib/settings/store';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/notifications/device', () => ({
  notificationPermission: jest.fn(),
  applySchedule: jest.fn(async () => undefined),
}));
jest.mock('@/lib/notifications/permissions', () => ({ requestNotificationPermission: jest.fn() }));
jest.mock('@/lib/notifications/pushToken', () => ({ restorePushToken: jest.fn(async () => undefined) }));
jest.mock('@/lib/data/hooks', () => ({ fetchWeekLogs: async () => [] }));

const mockStored = new Map<string, string>();
jest.mock('@/lib/storage/secureStore', () => ({
  ...jest.requireActual('@/lib/storage/secureStore'),
  getItem: async (key: string) => mockStored.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    mockStored.set(key, value);
    return true;
  },
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};
const LABEL = en.notifications.workout_reminder.label;
const permission = jest.mocked(notificationPermission);
const schedule = jest.mocked(applySchedule);

const settle = () =>
  act(async () => {
    await new Promise((r) => setImmediate(r));
  });

async function render() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <NotificationSettingsList />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
}

type Tree = Awaited<ReturnType<typeof render>>;

async function turnWorkoutOff() {
  const tree = await render();
  const toggle = findAll(tree, (p) => p.accessibilityRole === 'switch' && p.accessibilityLabel === LABEL)[0];
  await act(async () => {
    toggle.props.onValueChange(false);
    await new Promise((r) => setImmediate(r));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockStored.clear();
  useSettingsStore.getState().reset();
});

test('with permission granted, a switch change saves and reschedules without the workout reminder', async () => {
  permission.mockResolvedValue(true);
  await turnWorkoutOff();
  expect(useSettingsStore.getState().notifications.enabled.workout_reminder).toBe(false);
  expect(schedule).toHaveBeenCalledTimes(1);
  expect(schedule.mock.calls[0][0].some((n) => n.category === 'workout_reminder')).toBe(false);
  expect(requestNotificationPermission).not.toHaveBeenCalled();
});

test('without permission, a switch change only saves and never asks', async () => {
  permission.mockResolvedValue(false);
  await turnWorkoutOff();
  expect(JSON.parse(mockStored.get('lume.notificationSettings') ?? '{}').enabled.workout_reminder).toBe(false);
  expect(schedule).not.toHaveBeenCalled();
  expect(requestNotificationPermission).not.toHaveBeenCalled();
});

describe('quiet hours', () => {
  const KEY = 'lume.notificationSettings';
  const Q = en.notifications.quietHours;
  const saved = () => JSON.parse(mockStored.get(KEY) ?? 'null')?.quietHours;

  async function openQuietHours() {
    const tree = await render();
    const row = findAll(tree, (p) => p.accessibilityRole === 'button' && String(p.accessibilityLabel).startsWith(Q.label))[0];
    await act(async () => {
      row.props.onPress();
    });
    return tree;
  }

  // The Stepper's one adjustable element carries the shown time and the step actions.
  const stepperOf = (tree: Tree, edge: 'start' | 'end') =>
    findAll(tree, (p) => p.testID === `quiet-hours-${edge}` && p.accessibilityRole === 'adjustable')[0];

  const shown = (tree: Tree, edge: 'start' | 'end') => stepperOf(tree, edge).props.accessibilityValue.text;

  const step = async (tree: Tree, edge: 'start' | 'end', actionName: 'increment' | 'decrement') => {
    const stepper = stepperOf(tree, edge);
    await act(async () => {
      stepper.props.onAccessibilityAction({ nativeEvent: { actionName } });
    });
    await settle();
  };

  test('the sheet shows the default start and end, 22:00 and 07:00', async () => {
    const tree = await openQuietHours();
    expect(allText(tree)).toContain(Q.start);
    expect(allText(tree)).toContain(Q.end);
    expect(shown(tree, 'start')).toBe('22:00');
    expect(shown(tree, 'end')).toBe('07:00');
  });

  test('changing the start saves it at once', async () => {
    permission.mockResolvedValue(false);
    const tree = await openQuietHours();
    await step(tree, 'start', 'decrement');
    expect(shown(tree, 'start')).toBe('21:45');
    expect(saved()).toEqual({ start: 21 * 60 + 45, end: 7 * 60 });
    expect(useSettingsStore.getState().notifications.quietHours).toEqual({ start: 21 * 60 + 45, end: 7 * 60 });
  });

  test('changing the end saves it at once', async () => {
    permission.mockResolvedValue(false);
    const tree = await openQuietHours();
    await step(tree, 'end', 'increment');
    expect(shown(tree, 'end')).toBe('07:15');
    expect(saved()).toEqual({ start: 22 * 60, end: 7 * 60 + 15 });
  });

  test('an equal start and end shows the error and is not saved', async () => {
    permission.mockResolvedValue(true);
    mockStored.set(KEY, JSON.stringify({ quietHours: { start: 22 * 60, end: 21 * 60 + 45 } }));
    const tree = await openQuietHours();
    await step(tree, 'end', 'increment');
    expect(shown(tree, 'end')).toBe('22:00');
    expect(allText(tree)).toContain(Q.sameTime);
    expect(saved()).toEqual({ start: 22 * 60, end: 21 * 60 + 45 });
    expect(schedule).not.toHaveBeenCalled();
  });

  test('without permission a change saves and does not reschedule or ask', async () => {
    permission.mockResolvedValue(false);
    const tree = await openQuietHours();
    await step(tree, 'start', 'increment');
    expect(saved()).toEqual({ start: 22 * 60 + 15, end: 7 * 60 });
    expect(schedule).not.toHaveBeenCalled();
    expect(requestNotificationPermission).not.toHaveBeenCalled();
  });

  test('with permission granted a change saves and reschedules once', async () => {
    permission.mockResolvedValue(true);
    const tree = await openQuietHours();
    await step(tree, 'start', 'increment');
    expect(saved()).toEqual({ start: 22 * 60 + 15, end: 7 * 60 });
    expect(schedule).toHaveBeenCalledTimes(1);
    expect(requestNotificationPermission).not.toHaveBeenCalled();
  });
});
