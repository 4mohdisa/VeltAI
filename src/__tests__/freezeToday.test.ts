// A freeze protects TODAY, because that is the only day the server can freeze.
//
// POST /api/gym/streak/freeze takes no date: the handler sets last_freeze_date
// to today, refuses when today is already covered, and refuses once the streak
// is already broken (backend/internal/gym/gym.go). The sheet used to default to
// tomorrow, and to honour an `offset` param from the (parked) streak screen, so
// the local store recorded a freeze on a day no server row ever backed — and the
// Gym calendar drew it there.
import { readFileSync } from 'fs';
import { join } from 'path';

import { useGymStore } from '@/lib/data/gymStore';
import { todayISO } from '@/lib/data/mappers';

const sheet = readFileSync(join(__dirname, '..', 'app/gym/freeze.tsx'), 'utf8');

test('the sheet freezes today, not tomorrow, and ignores any requested offset', () => {
  expect(sheet).toContain('applyFreeze(0)');
  expect(sheet).not.toMatch(/'tomorrow'/);
  expect(sheet).not.toMatch(/Number\(params\.offset\)/);
});

test('the store records the freeze on today', () => {
  useGymStore.getState().reset();
  useGymStore.setState((s) => ({ streak: { ...s.streak, freezesAvailable: 1 } }));
  useGymStore.getState().applyFreeze(0);
  expect(useGymStore.getState().frozenDates).toEqual([todayISO()]);
});
