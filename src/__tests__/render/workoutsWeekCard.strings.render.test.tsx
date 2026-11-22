// PHASE3_ROWS.md row 14, the Summary tab's Workouts card
// (src/components/domain/WorkoutsWeekCard.tsx): the unit next to the session
// count reads workoutsWeek.sessionUnit in the app language, singular for 1.
import { WorkoutsWeekCard } from '@/components/domain/WorkoutsWeekCard';
import type { WorkoutsWeek } from '@/lib/data/summaryCards';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, renderScreen } from './helpers';

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
});
