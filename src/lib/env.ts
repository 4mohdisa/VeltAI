// Build-type detection. __DEV__ is compiled in by Metro: true in dev bundles
// (expo start / Expo Go / dev client), false in release builds. Undefined under
// jest (node env) — treated as a dev build so tests exercise the dev-mode paths.
export function isDevBuild(): boolean {
  return typeof __DEV__ === 'undefined' ? true : __DEV__;
}
