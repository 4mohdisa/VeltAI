// Row 14a · Keeps the feedback prompt state in secure storage, so the throttle
// rules survive a relaunch. A missing or unreadable record reads as the initial
// state; no call throws.
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage/secureStore';
import { INITIAL_FEEDBACK_PROMPT_STATE, type FeedbackPromptState } from './throttle';

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
    return isPromptState(parsed) ? parsed : INITIAL_FEEDBACK_PROMPT_STATE;
  } catch {
    return INITIAL_FEEDBACK_PROMPT_STATE;
  }
}

export async function saveFeedbackPromptState(state: FeedbackPromptState): Promise<void> {
  await setItem(STORAGE_KEYS.feedbackPrompt, JSON.stringify(state));
}

/** Counts one app launch: call once at start-up. Returns the saved state. */
export async function recordLaunch(): Promise<FeedbackPromptState> {
  const state = await loadFeedbackPromptState();
  const next = { ...state, sessionCount: state.sessionCount + 1 };
  await saveFeedbackPromptState(next);
  return next;
}
