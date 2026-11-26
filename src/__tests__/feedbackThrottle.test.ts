// PHASE4_ROWS.md row 14a, step 1: the feature feedback throttle
// (src/lib/feedback/throttle.ts). Pure logic under a fake clock: every time is
// an explicit epoch value, and the module never reads the system clock.
import { AFTER_PURCHASE_FEATURE_KEYS, FEATURE_KEYS } from '@/lib/feedback/features';
import {
  canPromptFeature,
  INITIAL_FEEDBACK_PROMPT_STATE,
  recordPrompt,
  type FeedbackPromptState,
} from '@/lib/feedback/throttle';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const T0 = Date.UTC(2026, 10, 1, 9, 0, 0);

/** A second-session user who has never been asked. */
const ready = (over: Partial<FeedbackPromptState> = {}): FeedbackPromptState => ({
  ...INITIAL_FEEDBACK_PROMPT_STATE,
  sessionCount: 2,
  ...over,
});

const reason = (state: FeedbackPromptState, now = T0, duringAction = false) =>
  canPromptFeature(state, 'barcode_scan', now, duringAction);

describe('feature keys', () => {
  test('the after-purchase keys are kept out of the in-use list', () => {
    expect(FEATURE_KEYS).toHaveLength(11);
    expect(FEATURE_KEYS).not.toEqual(expect.arrayContaining(['paywall']));
    expect(FEATURE_KEYS).not.toEqual(expect.arrayContaining(['trial']));
    expect(AFTER_PURCHASE_FEATURE_KEYS).toEqual(['paywall', 'trial']);
  });
});

describe('canPromptFeature', () => {
  test('the initial state has the switch on', () => {
    expect(INITIAL_FEEDBACK_PROMPT_STATE.enabled).toBe(true);
  });

  test('allowed for a second-session user never asked before', () => {
    expect(reason(ready())).toEqual({ allowed: true, reason: 'allowed' });
  });

  test('disabled when the global switch is off, whatever else holds', () => {
    expect(reason(ready({ enabled: false }))).toEqual({ allowed: false, reason: 'disabled' });
    expect(reason({ ...INITIAL_FEEDBACK_PROMPT_STATE, enabled: false }, T0, true).reason).toBe('disabled');
  });

  test('first_session until the second session', () => {
    expect(reason(ready({ sessionCount: 0 }))).toEqual({ allowed: false, reason: 'first_session' });
    expect(reason(ready({ sessionCount: 1 }))).toEqual({ allowed: false, reason: 'first_session' });
    expect(reason(ready({ sessionCount: 2 })).allowed).toBe(true);
  });

  test('during_action while the user is mid action', () => {
    expect(reason(ready(), T0, true)).toEqual({ allowed: false, reason: 'during_action' });
  });

  test('dont_ask_again blocks only the features listed', () => {
    const state = ready({ dontAskAgain: ['barcode_scan'] });
    expect(reason(state)).toEqual({ allowed: false, reason: 'dont_ask_again' });
    expect(canPromptFeature(state, 'photo_scan', T0, false)).toEqual({ allowed: true, reason: 'allowed' });
  });

  test('feature_cooldown until exactly 30 days after that feature was asked', () => {
    const state = ready({ lastPromptByFeature: { barcode_scan: T0 } });
    expect(reason(state, T0 + 30 * DAY - 1)).toEqual({ allowed: false, reason: 'feature_cooldown' });
    expect(reason(state, T0 + 30 * DAY)).toEqual({ allowed: true, reason: 'allowed' });
  });

  test('the cooldown of one feature does not block another', () => {
    const state = ready({ lastPromptByFeature: { barcode_scan: T0 - 2 * DAY } });
    expect(canPromptFeature(state, 'gym_session', T0, false).allowed).toBe(true);
  });

  test('daily_limit until exactly 24 hours after any prompt', () => {
    const state = ready({ lastPromptAt: T0 });
    expect(reason(state, T0 + DAY - 1)).toEqual({ allowed: false, reason: 'daily_limit' });
    expect(reason(state, T0 + DAY)).toEqual({ allowed: true, reason: 'allowed' });
  });
});

describe('recordPrompt', () => {
  test('returns a new state with the prompt recorded and leaves the input unchanged', () => {
    const input = ready({ lastPromptByFeature: { goals: T0 - 40 * DAY }, dontAskAgain: ['streaks'] });
    const snapshot = structuredClone(input);

    const next = recordPrompt(input, 'barcode_scan', T0);

    expect(next).toEqual({
      ...snapshot,
      lastPromptAt: T0,
      lastPromptByFeature: { goals: T0 - 40 * DAY, barcode_scan: T0 },
    });
    expect(next).not.toBe(input);
    expect(next.lastPromptByFeature).not.toBe(input.lastPromptByFeature);
    expect(input).toEqual(snapshot);
  });

  test('a recorded prompt then blocks that feature and, for a day, every other one', () => {
    const next = recordPrompt(ready(), 'barcode_scan', T0);
    expect(reason(next, T0 + HOUR).reason).toBe('feature_cooldown');
    expect(canPromptFeature(next, 'goals', T0 + HOUR, false).reason).toBe('daily_limit');
    expect(canPromptFeature(next, 'goals', T0 + DAY, false).allowed).toBe(true);
  });
});
