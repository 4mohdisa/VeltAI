// useLoggedDays (src/lib/data/foodDays.ts), the read behind the week strip and
// calendar dots (PHASE3_ROWS.md row 13). A failed read must report `error`, not
// pass itself off as "nothing logged". Executes the real hook through the shared
// harness; @/lib/api is mocked at the module boundary.
import TestRenderer from 'react-test-renderer';

import { useLoggedDays } from '@/lib/data/foodDays';

import { mountHook } from './helpers/useApiHarness';

// Plain-node Jest project: declare the act environment so React does not warn.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockDays = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { foodLogs: { days: (...args: unknown[]) => mockDays(...args) } },
}));

const settle = async () => {
  await TestRenderer.act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

const refetch = async (state: ReturnType<typeof useLoggedDays> | undefined) => {
  TestRenderer.act(() => state!.refetch());
  await settle();
};

beforeEach(() => mockDays.mockReset());

test('success: the logged dates come back with no error', async () => {
  mockDays.mockResolvedValueOnce(['2026-11-24', '2026-11-25']);
  const hook = await mountHook(useLoggedDays, undefined);

  const s = hook.latest()!;
  expect([...s.days]).toEqual(['2026-11-24', '2026-11-25']);
  expect(s.data).toBe(s.days);
  expect(s.isLoading).toBe(false);
  expect(s.loading).toBe(false);
  expect(s.error).toBeNull();
  hook.unmount();
});

test('loading: reported until the read settles', async () => {
  let resolve!: (dates: string[]) => void;
  mockDays.mockReturnValueOnce(new Promise<string[]>((r) => (resolve = r)));
  const hook = await mountHook(useLoggedDays, undefined);

  expect(hook.latest()!.isLoading).toBe(true);
  expect(hook.latest()!.loading).toBe(true);

  resolve(['2026-11-25']);
  await settle();
  expect(hook.latest()!.isLoading).toBe(false);
  hook.unmount();
});

test('network failure sets error and leaves the dates already held untouched', async () => {
  mockDays.mockResolvedValueOnce(['2026-11-25']).mockRejectedValueOnce(new TypeError('Network request failed'));
  const hook = await mountHook(useLoggedDays, undefined);

  await refetch(hook.latest());
  const s = hook.latest()!;
  expect(s.error).toBeInstanceOf(TypeError);
  expect([...s.days]).toEqual(['2026-11-25']);
  expect(s.isLoading).toBe(false);
  hook.unmount();
});

test('refetch clears the error on success', async () => {
  mockDays.mockRejectedValueOnce(new TypeError('Network request failed')).mockResolvedValueOnce(['2026-11-25']);
  const hook = await mountHook(useLoggedDays, undefined);
  expect(hook.latest()!.error).not.toBeNull();

  await refetch(hook.latest());
  const s = hook.latest()!;
  expect(s.error).toBeNull();
  expect([...s.days]).toEqual(['2026-11-25']);
  hook.unmount();
});

test('a failed refetch keeps the error', async () => {
  mockDays.mockRejectedValueOnce(new TypeError('Network request failed')).mockRejectedValueOnce(new Error('503'));
  const hook = await mountHook(useLoggedDays, undefined);

  await refetch(hook.latest());
  const s = hook.latest()!;
  expect(s.error).not.toBeNull();
  expect(s.days.size).toBe(0);
  expect(mockDays).toHaveBeenCalledTimes(2);
  hook.unmount();
});
