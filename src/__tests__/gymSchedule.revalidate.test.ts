// revalidate (src/lib/data/gymSchedule.ts) — a silent background re-read for
// useToday that must never flip `loading`, unlike refetch. Executes the real
// hook through a minimal harness component, mocking @/lib/api at the module
// boundary the same way todayCard.render.test.tsx does.
import { createElement } from 'react';
import TestRenderer from 'react-test-renderer';

import { useApi, useToday } from '@/lib/data/gymSchedule';

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

// isError: a failed read must be told apart from a real empty result, which
// the fallback alone cannot do (EMPTY_STATES_AUDIT.md, gym screens on error).
type ApiState = ReturnType<typeof useApi<string[]>>;

function ApiHarness({ fetcher, onState }: { fetcher: () => Promise<string[]>; onState: (s: ApiState) => void }) {
  onState(useApi(fetcher, []));
  return null;
}

const readOnce = async (fetcher: () => Promise<string[]>): Promise<ApiState | undefined> => {
  let latest: ApiState | undefined;
  let tree: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(createElement(ApiHarness, { fetcher, onState: (s) => (latest = s) }));
  });
  await settle();
  TestRenderer.act(() => {
    tree.unmount();
  });
  return latest;
};

test('useApi reports isError when the request fails', async () => {
  const state = await readOnce(() => Promise.reject(new TypeError('Network request failed')));
  expect(state).toMatchObject({ data: [], loading: false, isError: true });
});

test('useApi reports no error when the request succeeds', async () => {
  const state = await readOnce(() => Promise.resolve(['Back Squat']));
  expect(state).toMatchObject({ data: ['Back Squat'], loading: false, isError: false });
});
