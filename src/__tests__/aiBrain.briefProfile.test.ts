// useMorningBrief and useBrainProfile (src/lib/data/aiBrain.ts) report a failed
// read through isError instead of an unhandled rejection, and drop any result
// that settles after unmount. useAIQuery answers not_enough_data with the
// aiQuery.notEnoughData text, and a daily-limit 429 with null after one call
// and an info toast carrying the server message. Mounts the real hooks through the shared harness
// and mocks @/lib/api and the consent check at the module boundary.
import { useToastStore } from '@/components/display/toastStore';
import { ApiError } from '@/lib/api';
import { useAIQuery, useBrainProfile, useMorningBrief } from '@/lib/data/aiBrain';
import en from '@/lib/i18n/locales/en.json';
import type { AIBrainProfile, MorningBrief } from '@/lib/types';

import { mountHook, readHook } from './helpers/useApiHarness';

const mockGetMorningBrief = jest.fn();
const mockMarkBriefShown = jest.fn();
const mockGetProfile = jest.fn();
const mockQuery = jest.fn();
jest.mock('@/lib/api', () => ({
  ApiError: jest.requireActual<typeof import('@/lib/api')>('@/lib/api').ApiError,
  api: {
    ai: {
      getMorningBrief: (...args: unknown[]) => mockGetMorningBrief(...args),
      markBriefShown: (...args: unknown[]) => mockMarkBriefShown(...args),
      getProfile: (...args: unknown[]) => mockGetProfile(...args),
      query: (...args: unknown[]) => mockQuery(...args),
    },
  },
}));

const mockHasAiConsent = jest.fn();
jest.mock('@/lib/ai/consent', () => ({
  hasAiConsent: () => mockHasAiConsent(),
}));

const BRIEF: MorningBrief = {
  id: 'brief-2026-11-25',
  brief: 'You hit your protein goal yesterday.',
  brief_date: '2026-11-25',
  category: null,
  shown_at: null,
  engaged: false,
  generated_at: '2026-11-25T07:00:00Z',
};

const PROFILE = { not_enough_data: false } as AIBrainProfile;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const flush = () => new Promise((r) => setImmediate(r));

beforeEach(() => {
  jest.resetAllMocks();
  mockHasAiConsent.mockResolvedValue(true);
  mockMarkBriefShown.mockResolvedValue(undefined);
});

describe('useMorningBrief', () => {
  test('success gives the brief, isError false and loading false', async () => {
    mockGetMorningBrief.mockResolvedValueOnce(BRIEF);
    expect(await readHook(useMorningBrief)).toEqual({ brief: BRIEF, loading: false, isError: false });
    expect(mockMarkBriefShown).toHaveBeenCalledWith(BRIEF.id);
  });

  test('an ApiError gives isError true, brief null and loading false', async () => {
    mockGetMorningBrief.mockRejectedValueOnce(new ApiError(500, 'failed to load data'));
    expect(await readHook(useMorningBrief)).toEqual({ brief: null, loading: false, isError: true });
    expect(mockMarkBriefShown).not.toHaveBeenCalled();
  });

  test('unmounting before consent settles never fetches the brief', async () => {
    const consent = deferred<boolean>();
    mockHasAiConsent.mockReturnValueOnce(consent.promise);
    const mounted = await mountHook(useMorningBrief, undefined);
    expect(mounted.latest()).toEqual({ brief: null, loading: true, isError: false });
    mounted.unmount();
    consent.resolve(true);
    await flush();
    expect(mockGetMorningBrief).not.toHaveBeenCalled();
  });

  test('a brief that arrives after unmount is dropped', async () => {
    const pending = deferred<MorningBrief>();
    mockGetMorningBrief.mockReturnValueOnce(pending.promise);
    const mounted = await mountHook(useMorningBrief, undefined);
    mounted.unmount();
    pending.resolve(BRIEF);
    await flush();
    expect(mockMarkBriefShown).not.toHaveBeenCalled();
    expect(mounted.latest()).toEqual({ brief: null, loading: true, isError: false });
  });
});

describe('useBrainProfile', () => {
  test('success gives the profile, isError false and loading false', async () => {
    mockGetProfile.mockResolvedValueOnce(PROFILE);
    expect(await readHook(useBrainProfile)).toEqual({
      profile: PROFILE,
      loading: false,
      notEnoughData: false,
      isError: false,
    });
  });

  test('an ApiError gives isError true, profile null and loading false', async () => {
    mockGetProfile.mockRejectedValueOnce(new ApiError(500, 'failed to load brain'));
    expect(await readHook(useBrainProfile)).toEqual({
      profile: null,
      loading: false,
      notEnoughData: true,
      isError: true,
    });
  });

  test('a rejection after unmount leaves the last state', async () => {
    let reject!: (reason: unknown) => void;
    mockGetProfile.mockReturnValueOnce(
      new Promise((_, r) => {
        reject = r;
      }),
    );
    const mounted = await mountHook(useBrainProfile, undefined);
    mounted.unmount();
    reject(new ApiError(500, 'failed to load brain'));
    await flush();
    expect(mounted.latest()).toEqual({ profile: null, loading: true, notEnoughData: true, isError: false });
  });
});

describe('useAIQuery', () => {
  test('a not_enough_data answer gives the aiQuery.notEnoughData text', async () => {
    mockQuery.mockResolvedValueOnce({ state: 'not_enough_data' });
    const query = await readHook(useAIQuery);
    expect(await query?.ask('How is my protein?')).toBe(en.aiQuery.notEnoughData);
    expect(mockQuery).toHaveBeenCalledWith('How is my protein?', 'ai-query');
  });

  test('a daily-limit 429 gives null after one call and toasts the server message', async () => {
    const message = "You've used today's AI allowance. It resets at midnight UTC.";
    useToastStore.setState({ current: null });
    mockQuery.mockRejectedValueOnce(new ApiError(429, message, { code: 'ai_daily_limit_reached' }));
    const query = await readHook(useAIQuery);
    expect(await query?.ask('How is my protein?')).toBeNull();
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(useToastStore.getState().current).toMatchObject({ message, tone: 'info' });
  });
});
