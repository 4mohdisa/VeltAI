// revalidate (src/lib/data/gymSchedule.ts) — a silent background re-read for
// useToday that must never flip `loading`, unlike refetch. Executes the real
// hook through a minimal harness component, mocking @/lib/api at the module
// boundary the same way todayCard.render.test.tsx does.
import { createElement } from 'react';
import TestRenderer from 'react-test-renderer';

import { useToday } from '@/lib/data/gymSchedule';

// This file runs under the plain-node Jest project (no jest-expo preset), which
// never sets this flag, so React's act() warns that updates aren't wrapped —
// even though every one of them below is. Declaring it is the standard fix.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockGetToday = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { gym: { getToday: (...args: unknown[]) => mockGetToday(...args) } },
}));

const WORKOUT = {
  day_of_week: 2,
  day_name: 'Tuesday',
  is_rest_day: false,
  template: null,
  exercises: [],
  already_checked_in: false,
  session_id: null,
};
const REVALIDATED = { ...WORKOUT, already_checked_in: true, session_id: 's1' };

type TodayState = ReturnType<typeof useToday>;

function Harness({ onState }: { onState: (s: TodayState) => void }) {
  onState(useToday());
  return null;
}

const settle = async () => {
  await TestRenderer.act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

test('revalidate updates data and never sets loading true', async () => {
  mockGetToday.mockResolvedValueOnce(WORKOUT).mockResolvedValueOnce(REVALIDATED);
  const loadingSeen: boolean[] = [];
  let latest: TodayState | undefined;
  const onState = (s: TodayState) => {
    loadingSeen.push(s.loading);
    latest = s;
  };

  let tree: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(createElement(Harness, { onState }));
  });
  await settle();

  expect(latest?.today).toEqual(WORKOUT);
  loadingSeen.length = 0; // only the revalidate call matters from here

  TestRenderer.act(() => {
    latest?.revalidate();
  });
  await settle();

  expect(latest?.today).toEqual(REVALIDATED);
  expect(loadingSeen).not.toContain(true);

  TestRenderer.act(() => {
    tree.unmount();
  });
});
