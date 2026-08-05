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
