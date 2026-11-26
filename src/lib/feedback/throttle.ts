// Row 14a · When a feature feedback prompt may show. Pure logic: every time is
// the `now` the caller passes in, so the rules run under a fake clock in tests.
import type { FeatureKey } from './features';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const FEATURE_COOLDOWN_MS = 30 * DAY_MS;
const DAILY_LIMIT_MS = DAY_MS;

export type FeedbackPromptState = {
  sessionCount: number;
  enabled: boolean;
  lastPromptAt: number | null;
  lastPromptByFeature: Partial<Record<FeatureKey, number>>;
  dontAskAgain: FeatureKey[];
};

export const INITIAL_FEEDBACK_PROMPT_STATE: FeedbackPromptState = {
  sessionCount: 0,
  enabled: true,
  lastPromptAt: null,
  lastPromptByFeature: {},
  dontAskAgain: [],
};

export type PromptReason =
  | 'disabled'
  | 'first_session'
  | 'during_action'
  | 'dont_ask_again'
  | 'feature_cooldown'
  | 'daily_limit'
  | 'allowed';

/** The first rule that blocks the prompt, in order, or allowed. */
function reasonFor(state: FeedbackPromptState, feature: FeatureKey, now: number, duringAction: boolean): PromptReason {
  if (!state.enabled) return 'disabled';
  if (state.sessionCount < 2) return 'first_session';
  if (duringAction) return 'during_action';
  if (state.dontAskAgain.includes(feature)) return 'dont_ask_again';
  const lastForFeature = state.lastPromptByFeature[feature];
  if (lastForFeature !== undefined && now - lastForFeature < FEATURE_COOLDOWN_MS) return 'feature_cooldown';
  if (state.lastPromptAt !== null && now - state.lastPromptAt < DAILY_LIMIT_MS) return 'daily_limit';
  return 'allowed';
}

export function canPromptFeature(
  state: FeedbackPromptState,
  feature: FeatureKey,
  now: number,
  duringAction: boolean,
): { allowed: boolean; reason: PromptReason } {
  const reason = reasonFor(state, feature, now, duringAction);
  return { allowed: reason === 'allowed', reason };
}

/** A new state with the prompt for `feature` recorded at `now`; the input is not changed. */
export function recordPrompt(state: FeedbackPromptState, feature: FeatureKey, now: number): FeedbackPromptState {
  return {
    ...state,
    lastPromptAt: now,
    lastPromptByFeature: { ...state.lastPromptByFeature, [feature]: now },
  };
}
