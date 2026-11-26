// Row 10: a Settings notification switch saves, then reschedules the device's
// reminders only when permission is already granted. It never asks for
// permission. device.ts and permissions.ts are mocked; storage is an in-memory map.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { NotificationSettingsList } from '@/components/domain/NotificationSettingsList';
import en from '@/lib/i18n/locales/en.json';
import { applySchedule, notificationPermission } from '@/lib/notifications/device';
import { requestNotificationPermission } from '@/lib/notifications/permissions';
import { useSettingsStore } from '@/lib/settings/store';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/lib/notifications/device', () => ({
  notificationPermission: jest.fn(),
  applySchedule: jest.fn(async () => undefined),
}));
jest.mock('@/lib/notifications/permissions', () => ({ requestNotificationPermission: jest.fn() }));
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

async function turnWorkoutOff() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <NotificationSettingsList />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
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
