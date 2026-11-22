// PHASE3_ROWS.md row 14, Gym tab cards: a failed read shows the load-failed
// notice instead of a first-use prompt (MuscleChart, GymPatternsCard), the
// schedule card is never blank (MyScheduleCard), and the month calendar's
// legend and labels follow the app language (GymCalendar).
import { GymCalendar } from '@/components/domain/GymCalendar';
import { GymPatternsCard } from '@/components/gym/GymPatternsCard';
import { MuscleChart } from '@/components/gym/MuscleChart';
import { MyScheduleCard } from '@/components/gym/MyScheduleCard';
import { monthView } from '@/lib/data/gymRange';
import { useGymPatterns, useSchedule } from '@/lib/data/gymSchedule';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/data/gymSchedule', () => ({ useGymPatterns: jest.fn(), useSchedule: jest.fn() }));
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
  usePathname: () => '/',
  Href: {},
}));

const patterns = (value: { isError: boolean }) =>
  (useGymPatterns as jest.Mock).mockReturnValue({ patterns: null, loading: false, ...value });
const schedule = (value: { loading: boolean; isError: boolean }) =>
  (useSchedule as jest.Mock).mockReturnValue({ schedule: [], refetch: jest.fn(), ...value });

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('MuscleChart: a failed read shows the load-failed notice, not the log-workouts prompt', () => {
  patterns({ isError: true });
  const text = allText(renderScreen(<MuscleChart />));
  expect(text).toContain(en.gym.loadFailed);
  expect(text).not.toContain(en.muscleChart.empty);
});

test('MuscleChart: no data and no error keeps the first-use prompt, in Spanish', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  patterns({ isError: false });
  const text = allText(renderScreen(<MuscleChart />));
  expect(text).toContain(es.muscleChart.empty);
  expect(text).toContain(es.gymMuscles.title);
  expect(text).toContain(es.muscleChart.scope);
});

test('GymPatternsCard: a failed read shows the load-failed notice, not keep logging', () => {
  patterns({ isError: true });
  const text = allText(renderScreen(<GymPatternsCard />));
  expect(text).toContain(en.gym.loadFailed);
  expect(text).not.toContain(en.gym.keepLoggingPatterns);
});

test('MyScheduleCard: a failed read with nothing loaded shows the load-failed notice with retry', () => {
  schedule({ loading: false, isError: true });
  const tree = renderScreen(<MyScheduleCard />);
  expect(allText(tree)).toContain(en.gym.loadFailed);
  expect(findAll(tree, (p) => p.accessibilityRole === 'alert').length).toBeGreaterThan(0);
});

test('MyScheduleCard: no plan yet shows three rest days, not a blank space', () => {
  schedule({ loading: false, isError: false });
  const text = allText(renderScreen(<MyScheduleCard />));
  expect(text).toContain(en.gym.mySchedule);
  expect(text).toContain(en.gymLog.restDayTitle);
  expect(text).toContain(en.gym.daysPlanned_other.replace('{{count}}', '0'));
});

test('GymCalendar: legend, nav labels, weekday letters and day labels follow the app language', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  const view = monthView('2026-09-10', '2026-09-10', [], [], []);
  const tree = renderScreen(
    <GymCalendar title="septiembre" cells={view.cells} summary="" onPrev={jest.fn()} onNext={jest.fn()} canNext={false} />,
  );
  const text = allText(tree);
  expect(text).toContain(es.gymCalendar.less);
  expect(text).toContain(es.gymCalendar.more);
  for (const letter of es.calendar.weekdayLetters) expect(text).toContain(letter);
  const label = (p: Record<string, unknown>) => p.accessibilityLabel;
  expect(findAll(tree, (p) => label(p) === es.calendar.previousMonth)).not.toHaveLength(0);
  expect(findAll(tree, (p) => label(p) === es.gymCalendar.legendLabel)).not.toHaveLength(0);
  const past = findAll(tree, (p) => p.testID === 'gym-day-2026-09-03')[0].props.accessibilityLabel as string;
  expect(past.endsWith(', sin sesión')).toBe(true);
  const future = findAll(tree, (p) => p.testID === 'gym-day-2026-09-20')[0].props.accessibilityLabel as string;
  expect(future.endsWith(', próximo')).toBe(true);
});
