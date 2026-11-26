// PHASE4_ROWS.md row 14a, step 2: the feedback prompt state survives a relaunch
// (src/lib/feedback/promptStore.ts). Secure storage is the in-memory mock;
// every time is an explicit epoch value.
import { loadFeedbackPromptState, recordLaunch, saveFeedbackPromptState } from '@/lib/feedback/promptStore';
import { INITIAL_FEEDBACK_PROMPT_STATE, recordPrompt, type FeedbackPromptState } from '@/lib/feedback/throttle';
import { setItem, STORAGE_KEYS } from '@/lib/storage/secureStore';
import { __reset as resetSecureStore } from './mocks/expoSecureStore';

const T0 = Date.UTC(2026, 10, 1, 9, 0, 0);

const SAVED: FeedbackPromptState = {
  sessionCount: 3,
  enabled: true,
  lastPromptAt: T0,
  lastPromptByFeature: { barcode_scan: T0 },
  dontAskAgain: ['streaks'],
};

/** A fresh copy of promptStore.ts, as after an app relaunch: the same storage. */
const relaunch = () => {
  const secureStore = jest.requireActual('@/lib/storage/secureStore');
  let mod!: typeof import('@/lib/feedback/promptStore');
  jest.isolateModules(() => {
    jest.doMock('@/lib/storage/secureStore', () => secureStore);
    mod = jest.requireActual('@/lib/feedback/promptStore');
  });
  return mod;
};

beforeEach(() => {
  resetSecureStore();
});

test('nothing saved reads as the initial state', async () => {
  await expect(loadFeedbackPromptState()).resolves.toEqual(INITIAL_FEEDBACK_PROMPT_STATE);
});

test('save then load returns the same state', async () => {
  await saveFeedbackPromptState(SAVED);
  await expect(loadFeedbackPromptState()).resolves.toEqual(SAVED);
});

test('a fresh module after a relaunch still reads the saved state', async () => {
  await saveFeedbackPromptState(SAVED);
  await expect(relaunch().loadFeedbackPromptState()).resolves.toEqual(SAVED);
});

test.each([
  ['invalid JSON', '{not json'],
  ['a value of the wrong shape', JSON.stringify({ sessionCount: 'three' })],
])('%s reads as the initial state without throwing', async (_label, raw) => {
  await setItem(STORAGE_KEYS.feedbackPrompt, raw);
  await expect(loadFeedbackPromptState()).resolves.toEqual(INITIAL_FEEDBACK_PROMPT_STATE);
});

test('recordLaunch adds one session per call and saves it', async () => {
  await expect(recordLaunch()).resolves.toMatchObject({ sessionCount: 1 });
  await expect(relaunch().recordLaunch()).resolves.toMatchObject({ sessionCount: 2 });
  await expect(loadFeedbackPromptState()).resolves.toEqual({ ...INITIAL_FEEDBACK_PROMPT_STATE, sessionCount: 2 });
});

test('recordPrompt copies dontAskAgain, so changing the new array leaves the input alone', () => {
  const input: FeedbackPromptState = { ...SAVED, dontAskAgain: ['streaks'] };
  const next = recordPrompt(input, 'goals', T0);
  next.dontAskAgain.push('goals');
  expect(next.dontAskAgain).not.toBe(input.dontAskAgain);
  expect(input.dontAskAgain).toEqual(['streaks']);
});
