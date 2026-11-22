// PHASE3_ROWS.md row 14, gym/schedule and gym/new-template: a failed read shows
// the load-failed notice with retry instead of an empty week or an empty
// workout, an edit prefill that has not landed never reads as "no exercises",
// and the copy follows the app language.
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import NewTemplateScreen from '@/app/gym/new-template';
import ScheduleScreen from '@/app/gym/schedule';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

const mockGetSchedule = jest.fn();
const mockGetTemplates = jest.fn();
const mockGetTemplate = jest.fn();
const mockGetExercises = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    gym: {
      getSchedule: (...args: unknown[]) => mockGetSchedule(...args),
      getTemplates: (...args: unknown[]) => mockGetTemplates(...args),
      setScheduleDay: jest.fn(),
      getTemplate: (...args: unknown[]) => mockGetTemplate(...args),
      createTemplate: jest.fn(),
      updateTemplate: jest.fn(),
      getExercises: (...args: unknown[]) => mockGetExercises(...args),
    },
  },
}));

jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));

const mockParams = jest.fn((): { id?: string } => ({}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => mockParams(),
  usePathname: () => '/gym',
  Href: {},
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

const render = (el: ReactElement) =>
  renderScreen(<SafeAreaProvider initialMetrics={METRICS}>{el}</SafeAreaProvider>);

const REST_WEEK = [0, 1, 2, 3, 4, 5, 6].map((day_of_week) => ({
  day_of_week,
  day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day_of_week],
  is_rest_day: true,
  template_id: null,
  template: null,
}));

beforeEach(() => {
  mockGetSchedule.mockReset();
  mockGetTemplates.mockReset().mockResolvedValue([]);
  mockGetTemplate.mockReset();
  mockGetExercises.mockReset().mockResolvedValue([]);
  mockParams.mockReturnValue({});
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('schedule: a failed read shows the load-failed notice with retry, not an empty week', async () => {
  mockGetSchedule.mockRejectedValue(new Error('offline'));
  const tree = render(<ScheduleScreen />);
  await settle();
  const text = allText(tree);
  expect(text).toContain(en.gym.loadFailed);
  expect(text).not.toContain(en.gymSchedule.noWorkout);

  mockGetSchedule.mockResolvedValue(REST_WEEK);
  const retry = findAll(tree, (p) => p.accessibilityLabel === en.common.tryAgain)[0];
  await act(async () => {
    (retry.props.onPress as () => void)();
  });
  await settle();
  expect(allText(tree)).toContain(en.gymSchedule.noWorkout);
  expect(allText(tree)).not.toContain(en.gym.loadFailed);
});

test('schedule: day labels, rest days and the title follow the app language', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  mockGetSchedule.mockResolvedValue(REST_WEEK);
  const tree = render(<ScheduleScreen />);
  await settle();
  const text = allText(tree);
  expect(text).toContain(es.gym.mySchedule);
  expect(text).toContain(es.gymLog.restDayTitle);
  expect(text).toContain(es.gymSchedule.noWorkout);
  const monday = new Date(2023, 0, 2).toLocaleDateString('es', { weekday: 'long' });
  const row = es.gymSchedule.rowLabel.replace('{{day}}', monday).replace('{{workout}}', es.gymSchedule.restDay);
  expect(findAll(tree, (p) => p.accessibilityLabel === row)).not.toHaveLength(0);
});

test('new template, edit mode: a failed prefill shows the load-failed notice and Save stays off', async () => {
  mockParams.mockReturnValue({ id: 't1' });
  mockGetTemplate.mockRejectedValue(new Error('offline'));
  const tree = render(<NewTemplateScreen />);
  await settle();
  const text = allText(tree);
  expect(text).toContain(en.gym.loadFailed);
  expect(text).not.toContain(en.gymNewTemplate.emptyEditing);
  expect(buttonWithTitle(tree, en.gymNewTemplate.save)!.props.disabled).toBe(true);
});

test('new template, edit mode: before the prefill lands there is no "no exercises" line', async () => {
  mockParams.mockReturnValue({ id: 't1' });
  mockGetTemplate.mockReturnValue(new Promise(() => {}));
  const tree = render(<NewTemplateScreen />);
  await settle();
  expect(allText(tree)).not.toContain(en.gymNewTemplate.emptyEditing);
  expect(allText(tree)).toContain(en.gymNewTemplate.editTitle);
});

test('new template: the form copy follows the app language', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  const tree = render(<NewTemplateScreen />);
  await settle();
  const text = allText(tree);
  expect(text).toContain(es.gymTemplates.newWorkoutLabel);
  expect(text).toContain(es.gymNewTemplate.exercises);
  expect(text).toContain(es.gymNewTemplate.emptyNew);
  expect(buttonWithTitle(tree, es.gymNewTemplate.save)).toBeDefined();
  expect(buttonWithTitle(tree, es.gymSession.addExercise)).toBeDefined();
});
