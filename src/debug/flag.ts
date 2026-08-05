// The single gate for the whole debug-capture system.
//
// WHY NOT __DEV__: TestFlight builds are release builds, so __DEV__ is FALSE
// there. The capture system has to run in exactly the build __DEV__ excludes,
// which is why it needs its own flag.
//
// WHY NOT A RUNTIME TOGGLE: a debug overlay reachable in a shipped app is a
// 2.3.1 hidden-feature problem, and these reports contain screenshots of a
// health app. The flag is a build-time constant — Metro inlines
// process.env.EXPO_PUBLIC_* into the bundle, so `DEBUG_CAPTURE` is literally
// `false` in a production build and every `if (DEBUG_CAPTURE)` block folds away.
//
// The stronger guarantee lives in metro.config.js: with the flag off, the whole
// ./impl tree is resolved to ./stub, so the debug UI is not merely unreachable —
// it is not in the bundle graph at all. See src/__tests__/debugGating.test.ts.
export const DEBUG_CAPTURE = process.env.EXPO_PUBLIC_DEBUG_CAPTURE === '1';
