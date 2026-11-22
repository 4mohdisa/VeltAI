// useToday (src/lib/data/gymSchedule.ts) passes useApi's isError through, so a
// gym screen can tell "today's read failed" from "nothing scheduled". Mounts
// the real hook in a minimal harness and mocks @/lib/api at the module boundary,
// the same way gymSchedule.revalidate.test.ts does.
import { createElement } from 'react';
import TestRenderer from 'react-test-renderer';

import { useToday } from '@/lib/data/gymSchedule';

// Plain-node Jest project: declare the act() environment, as the sibling test does.
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

const readToday = async (): Promise<TodayState | undefined> => {
  let latest: TodayState | undefined;
  let tree: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(createElement(Harness, { onState: (s) => (latest = s) }));
  });
  await settle();
  TestRenderer.act(() => {
    tree.unmount();
  });
  return latest;
};

beforeEach(() => mockGetToday.mockReset());

test('useToday reports isError when the load fails', async () => {
  mockGetToday.mockRejectedValueOnce(new TypeError('Network request failed'));
  expect(await readToday()).toMatchObject({ today: null, loading: false, isError: true });
});

test('useToday reports no error when the load succeeds', async () => {
  mockGetToday.mockResolvedValueOnce(WORKOUT);
  expect(await readToday()).toMatchObject({ today: WORKOUT, loading: false, isError: false });
});
