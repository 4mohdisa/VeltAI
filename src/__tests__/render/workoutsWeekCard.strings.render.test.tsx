// PHASE3_ROWS.md row 14, the Summary tab's Workouts card
// (src/components/domain/WorkoutsWeekCard.tsx): the unit next to the session
// count reads workoutsWeek.sessionUnit in the app language, singular for 1;
// the title, scope, loading and error lines and the spoken label do too.
import { WorkoutsWeekCard } from '@/components/domain/WorkoutsWeekCard';
import type { WorkoutsWeek } from '@/lib/data/summaryCards';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, findAll, renderScreen } from './helpers';

const week = (sessions: number): WorkoutsWeek => ({ sessions, minutes: 0, untimed: 0, pips: [] });

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

describe.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
] as const)('%s', (lng, strings) => {
  beforeAll(async () => {
    await act(async () => {
      await i18n.changeLanguage(lng);
    });
  });

  test('one session uses the singular unit', () => {
    const text = allText(renderScreen(<WorkoutsWeekCard week={week(1)} loading={false} error={false} />));
    expect(text).toContain(`"${strings.workoutsWeek.sessionUnit_one}"`);
    expect(text).not.toContain(`"${strings.workoutsWeek.sessionUnit_other}"`);
  });

  test('three sessions use the plural unit', () => {
    const text = allText(renderScreen(<WorkoutsWeekCard week={week(3)} loading={false} error={false} />));
    expect(text).toContain(`"${strings.workoutsWeek.sessionUnit_other}"`);
    expect(text).not.toContain(`"${strings.workoutsWeek.sessionUnit_one}"`);
  });

  test('the title and scope read the app language', () => {
    const text = allText(renderScreen(<WorkoutsWeekCard week={week(1)} loading={false} error={false} />));
    expect(text).toContain(`"${strings.dashboard.workouts}"`);
    expect(text).toContain(`"${strings.dashboard.thisWeek}"`);
  });

  test('loading and error lines read the app language', () => {
    expect(allText(renderScreen(<WorkoutsWeekCard week={week(0)} loading error={false} />))).toContain(
      `"${strings.workoutsWeek.loading}"`,
    );
    expect(allText(renderScreen(<WorkoutsWeekCard week={week(0)} loading={false} error />))).toContain(
      `"${strings.workoutsWeek.loadFailed}"`,
    );
  });

  test.each([
    [1, strings.workoutsWeek.a11yLabel_one],
    [3, strings.workoutsWeek.a11yLabel_other],
  ])('the spoken label for %i session(s) reads the app language', (count, label) => {
    const tree = renderScreen(<WorkoutsWeekCard week={week(count)} loading={false} error={false} />);
    const expected = label.replace('{{count}}', String(count));
    const labels = findAll(tree, (p) => typeof p.accessibilityLabel === 'string').map((n) => n.props.accessibilityLabel as string);
    expect(labels.some((l) => l.startsWith(expected))).toBe(true);
  });
});
