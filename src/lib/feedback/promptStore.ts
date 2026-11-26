// Row 14a · Keeps the feedback prompt state in secure storage, so the throttle
// rules survive a relaunch. A missing or unreadable record reads as the initial
// state; no call throws.
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage/secureStore';
import { FEATURE_KEYS, type FeatureKey } from './features';
import { INITIAL_FEEDBACK_PROMPT_STATE, type FeedbackPromptState } from './throttle';

const isFeatureKey = (key: unknown): key is FeatureKey => (FEATURE_KEYS as readonly unknown[]).includes(key);

function isPromptState(value: unknown): value is FeedbackPromptState {
  const v = value as FeedbackPromptState | null;
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof v.sessionCount === 'number' &&
    typeof v.enabled === 'boolean' &&
    (v.lastPromptAt === null || typeof v.lastPromptAt === 'number') &&
    typeof v.lastPromptByFeature === 'object' &&
    v.lastPromptByFeature !== null &&
    Array.isArray(v.dontAskAgain)
  );
}

export async function loadFeedbackPromptState(): Promise<FeedbackPromptState> {
  try {
    const parsed: unknown = JSON.parse((await getItem(STORAGE_KEYS.feedbackPrompt)) ?? 'null');
    if (!isPromptState(parsed)) return INITIAL_FEEDBACK_PROMPT_STATE;
    // A key from an older or newer build is dropped, so only known features are throttled.
    return {
      ...parsed,
      lastPromptByFeature: Object.fromEntries(
        Object.entries(parsed.lastPromptByFeature).filter(([k, v]) => isFeatureKey(k) && typeof v === 'number'),
      ),
      dontAskAgain: parsed.dontAskAgain.filter(isFeatureKey),
    };
  } catch {
    return INITIAL_FEEDBACK_PROMPT_STATE;
  }
}

/** False when the write did not land; never throws. */
export async function saveFeedbackPromptState(state: FeedbackPromptState): Promise<boolean> {
  return setItem(STORAGE_KEYS.feedbackPrompt, JSON.stringify(state));
}

/** Counts one app launch: call once at start-up. Returns the new state, saved or not. */
export async function recordLaunch(): Promise<FeedbackPromptState> {
  const state = await loadFeedbackPromptState();
  const next = { ...state, sessionCount: state.sessionCount + 1 };
  await saveFeedbackPromptState(next);
  return next;
}
