// V7 — the Gym month calendar, rendered. Pins the design's exact values
// (GymScreen.dc.html) so the grid cannot drift back to the old index heatmap:
// dated cells under an M–S header, the four-step ramp by minutes, today ringed,
// future days outlined, a 7pt radius on a 5pt gap, 11pt Less → More swatches.
import { StyleSheet } from 'react-native';

import {
  CELL_GAP,
  CELL_RADIUS,
  GymCalendar,
  NAV_SIZE,
  RAMP,
  SWATCH,
  SWATCH_RADIUS,
  mixHex,
} from '@/components/domain/GymCalendar';
import { monthView } from '@/lib/data/gymRange';
import { categoryAccent, color } from '@/lib/design/tokens';
import type { GymSession } from '@/lib/api';
import { allText, findAll, renderScreen } from './helpers';

const TODAY = '2026-09-10';
let n = 0;
const row = (date: string, duration_minutes: number | null): GymSession => ({
  id: `s${n++}`,
  user_id: 'u1',
  date,
  name: null,
  notes: null,
  duration_minutes,
  created_at: `${date}T18:00:00Z`,
});

function render(canNext = false) {
  const v = monthView(TODAY, TODAY, [row('2026-09-02', 20), row('2026-09-04', 45), row('2026-09-08', 75)], [], ['2026-09-07']);
  return renderScreen(
    <GymCalendar title="September" cells={v.cells} summary="3 sessions · 2h 20m · 1 freeze" onPrev={() => {}} onNext={() => {}} canNext={canNext} />,
  );
}

const styleOf = (tree: ReturnType<typeof render>, date: string) =>
  StyleSheet.flatten(findAll(tree, (p) => p.testID === `gym-day-${date}`)[0].props.style);

test('the design ramp: light-2, the streak accent 32% and 66% into light-1, the accent', () => {
  expect(RAMP[0]).toBe(color.light2);
  expect(RAMP[1]).toBe(mixHex(categoryAccent.streak, color.light1, 0.32));
  expect(RAMP[2]).toBe(mixHex(categoryAccent.streak, color.light1, 0.66));
  expect(RAMP[3]).toBe(categoryAccent.streak);
  // The same arithmetic worked by hand from #EC6330 and #F2F2F7, so the helper
  // cannot drift with the value it is checked against.
  expect(RAMP[1]).toBe('#f0c4b7');
  expect(RAMP[2]).toBe('#ee9474');
});

test('the design geometry is pinned', () => {
  expect([CELL_GAP, CELL_RADIUS, SWATCH, SWATCH_RADIUS, NAV_SIZE]).toEqual([5, 7, 11, 3, 32]);
});

test('draws the month by date: title, M–S header, every day 1–30, the summary and the key', () => {
  const text = allText(render());
  expect(text).toContain('September');
  for (const d of ['1', '15', '30']) expect(text).toContain(d);
  expect(text).toContain('3 sessions · 2h 20m · 1 freeze');
  expect(text).toContain('Less');
  expect(text).toContain('More');
});

test('each day is shaded by the minutes trained on it, on its real date', () => {
  const tree = render();
  expect(styleOf(tree, '2026-09-02').backgroundColor).toBe(RAMP[1]); // 20 min
  expect(styleOf(tree, '2026-09-04').backgroundColor).toBe(RAMP[2]); // 45 min
  expect(styleOf(tree, '2026-09-08').backgroundColor).toBe(RAMP[3]); // 75 min
  expect(styleOf(tree, '2026-09-03').backgroundColor).toBe(RAMP[0]); // rest day
  expect(styleOf(tree, '2026-09-07').backgroundColor).toBe(color.light3); // freeze
  expect(styleOf(tree, '2026-09-08').borderRadius).toBe(CELL_RADIUS);
});

test('today is ringed; future days are white with a hairline and never shaded', () => {
  const tree = render();
  expect(styleOf(tree, TODAY)).toMatchObject({ borderWidth: 2, borderColor: color.primary });
  expect(styleOf(tree, '2026-09-20')).toMatchObject({
    backgroundColor: color.white,
    borderWidth: 1,
    borderColor: color.light2,
  });
});

test('VoiceOver reads each day as what happened on it', () => {
  const tree = render();
  const label = (d: string) => findAll(tree, (p) => p.testID === `gym-day-${d}`)[0].props.accessibilityLabel as string;
  expect(label('2026-09-08')).toMatch(/1 session, 75 minutes$/);
  expect(label('2026-09-07')).toMatch(/streak freeze$/);
  expect(label('2026-09-03')).toMatch(/no session$/);
  expect(label('2026-09-20')).toMatch(/upcoming$/);
});

test('the next-month control is disabled on the current month and enabled when paged back', () => {
  const next = (canNext: boolean) => findAll(render(canNext), (p) => p.accessibilityLabel === 'Next month')[0];
  expect(next(false).props.accessibilityState).toMatchObject({ disabled: true });
  expect(next(true).props.accessibilityState).toMatchObject({ disabled: false });
});
