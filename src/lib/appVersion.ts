// The shipping version and build number, read from the build itself.
//
// profile/about.tsx and profile/support.tsx hardcoded '1.0.0' and build '1' as
// string literals, so from the second release onwards every support ticket
// would carry the wrong version and triage would be guesswork.
//
// expo-constants is already present (a transitive dependency of expo), so this
// costs no new package. Values come from app.json's expo.version and
// expo.ios.buildNumber, which are what EAS actually stamps into the binary.
import Constants from 'expo-constants';

/** e.g. "1.0.0" — empty string if the manifest is unavailable (bare workflow). */
export const APP_VERSION: string = Constants.expoConfig?.version ?? '';

/** e.g. "1" — iOS CFBundleVersion. */
export const BUILD_NUMBER: string = Constants.expoConfig?.ios?.buildNumber ?? '';

/** "1.0.0 (1)" — the one string support should ask users to read out. */
export const VERSION_LABEL: string = BUILD_NUMBER ? `${APP_VERSION} (${BUILD_NUMBER})` : APP_VERSION;

/**
 * The custom URL scheme this build registers (app.json expo.scheme), used for
 * OAuth return URLs. Both sides of the integrations flow hardcoded 'lume' while
 * app.json registered 'lume', so any callback that escaped the in-app auth
 * session dead-ended. Reading it from the manifest means the two can never
 * drift again; the backend's LUME_APP_SCHEME must be set to the same value.
 */
export const APP_SCHEME: string = Constants.expoConfig?.scheme
  ? String(Array.isArray(Constants.expoConfig.scheme) ? Constants.expoConfig.scheme[0] : Constants.expoConfig.scheme)
  : '';

/**
 * The commit this build came from, so a debug report names the exact code it
 * describes.
 *
 * History: an in-code comment used to claim eas.json set EXPO_PUBLIC_GIT_SHA.
 * It did not — eas.json env is static JSON and cannot compute a SHA — so every
 * report carried `gitSha: null` (audit 2026-08-06). app.config.js now stamps
 * it into `extra` at config-evaluation time, from EAS_BUILD_GIT_COMMIT_HASH on
 * a cloud build or `git rev-parse HEAD` locally. The env var is still honoured
 * first for non-EAS CI.
 *
 * Null when the build genuinely cannot know (a tarball with no work tree).
 * That is deliberate: a placeholder SHA is worse than an absent one.
 */
export const GIT_SHA: string | null =
  process.env.EXPO_PUBLIC_GIT_SHA ??
  (typeof Constants.expoConfig?.extra?.gitSha === 'string' ? Constants.expoConfig.extra.gitSha : null);

/** True when the build was made with uncommitted changes — it matches no commit. */
export const GIT_DIRTY: boolean = Constants.expoConfig?.extra?.gitDirty === true;
