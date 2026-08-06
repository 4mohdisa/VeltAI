// Third-party-AI consent (guideline 5.1.2(i)): personal data may not be shared
// with third-party AI without disclosure AND explicit permission. One
// acknowledgment covers both processors; until it is given, no scan upload
// happens and no AI endpoint is fetched. The key is cleared on sign-out
// (resetRegistry) so the next account re-acknowledges.
//
// The acknowledgment is recorded on the SERVER as well as the device. A device
// flag cannot gate the backend's 6-hour rebuild sweep, which marshals the
// user's logs and sends them to Anthropic with no device involved — so the
// server keeps its own record and refuses (403 ai_consent_required) without it.
import { getItem, setItem } from '@/lib/storage/secureStore';
import { api } from '@/lib/api';

export const AI_CONSENT_KEY = 'lume.aiConsent';

let cached: boolean | null = null;
let reconciled = false;

export async function hasAiConsent(): Promise<boolean> {
  if (cached === null) cached = (await getItem(AI_CONSENT_KEY)) === '1';
  if (cached && !reconciled) {
    reconciled = true;
    // Self-heal the offline-consent desync (audit 2026-08-06): accepting the
    // disclosure while offline stored the device flag but never the server
    // record, 403-locking every AI feature indefinitely. Re-assert once per
    // launch — the server write is idempotent (COALESCE keeps the first date).
    void api.ai.setConsent().catch(() => {});
  }
  return cached;
}

/** Withdraw consent (Settings → Privacy — guideline 5.1.2 requires a way out).
 *  Server record FIRST: it is what gates the backend's own 6-hour sweep, so
 *  clearing only the device flag would stop the UI while the server kept
 *  sending. Throws when the server cannot be reached — the caller surfaces it
 *  rather than pretending the withdrawal took effect. */
export async function revokeAiConsent(): Promise<void> {
  await api.ai.revokeConsent();
  cached = false;
  await setItem(AI_CONSENT_KEY, '0');
}

/** Show the one-time disclosure (if not yet acknowledged). Resolves true when
 *  the user has consented — only then may AI features send data. */
export async function ensureAiConsent(): Promise<boolean> {
  if (await hasAiConsent()) return true;
  // Lazy require: this module is imported by the (node-env) jest suites via
  // resetRegistry; react-native must not load at module scope there.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- see above
  const { Alert } = require('react-native') as typeof import('react-native');
  return new Promise((resolve) => {
    Alert.alert(
      'Lume uses AI partners',
      'Meal photos are analyzed by Google Gemini, and your logged data is summarized by Anthropic, to power scanning and insights. They process your data only to provide the feature — details in the Privacy Policy (Settings → Privacy).',
      [
        { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Continue',
          onPress: () => {
            cached = true;
            void setItem(AI_CONSENT_KEY, '1');
            // Best-effort: the device flag is what gates the UI, and the server
            // independently refuses until its own record exists. A failure here
            // means AI features 403 until the next acknowledgment rather than
            // data being sent without consent — the safe direction.
            void api.ai.setConsent().catch(() => {});
            resolve(true);
          },
        },
      ],
      { cancelable: false },
    );
  });
}

/** Sign-out / tests: forget the in-memory cache (the persisted key is removed
 *  by resetRegistry). */
export function __resetAiConsentCache(): void {
  cached = null;
  reconciled = false;
}
