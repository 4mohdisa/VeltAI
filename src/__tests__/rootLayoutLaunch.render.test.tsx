// PHASE4_ROWS.md row 14a, step 3: the root layout (src/app/_layout.tsx) counts
// one session for the feedback prompt throttle per launch. recordLaunch is
// mocked; so are the navigator and the start-up side effects the layout fires,
// so only the launch count is under test. Each test loads a fresh copy of the
// layout, as a new launch would, because its guard is module level.
import type { ReactElement } from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';

jest.mock('@/lib/feedback/promptStore', () => ({ recordLaunch: jest.fn() }));
// The real Stack needs a router context this render environment lacks (see
// render/onboardingLayoutReduceMotion.render.test.tsx).
jest.mock('expo-router', () => ({ Stack: Object.assign(() => null, { Screen: () => null }) }));
// The gesture root needs a native module jest has not got; a plain View stands in.
jest.mock('react-native-gesture-handler', () => ({ GestureHandlerRootView: jest.requireActual('react-native').View }));
jest.mock('expo-font', () => ({ useFonts: () => [true] }));
jest.mock('@/lib/crashReporting', () => ({ initCrashReporting: jest.fn() }));
jest.mock('@/lib/analyticsSink', () => ({ initAnalyticsSink: jest.fn() }));
jest.mock('@/lib/analytics', () => ({
  ...jest.requireActual('@/lib/analytics'),
  initAnalytics: jest.fn(async () => undefined),
  flushAnalytics: jest.fn(async () => undefined),
  track: jest.fn(),
}));
jest.mock('@/lib/offline/queue', () => ({
  ...jest.requireActual('@/lib/offline/queue'),
  loadQueue: jest.fn(async () => undefined),
  flush: jest.fn(async () => undefined),
}));
jest.mock('@/lib/notifications/daily', () => ({ startDailySchedule: () => () => undefined }));
jest.mock('@/lib/billing/purchases', () => ({ configurePurchases: jest.fn() }));
jest.mock('@/lib/config/requiredEnv', () => ({ configurationErrors: () => [] }));
jest.mock('@/lib/auth/clerkEnv', () => ({ isClerkEnabled: () => false, CLERK_PUBLISHABLE_KEY: '', clerkTokenCache: {} }));
// Clerk is off here; its headless bundle opens a MessagePort on import that keeps Jest alive.
jest.mock('@clerk/clerk-expo', () => ({ ClerkProvider: () => null, ClerkLoaded: () => null }));
jest.mock('@/lib/auth/ClerkBridge', () => ({ ClerkBridge: () => null }));
jest.mock('@/debug/DebugOverlay', () => ({ DebugOverlay: () => null }));

type Launch = {
  RootLayout: () => ReactElement;
  recordLaunch: jest.Mock;
  render: (el: ReactElement) => ReactTestRenderer;
  act: (cb: () => Promise<void> | void) => Promise<void>;
  allText: (tree: ReactTestRenderer) => string;
  unmountAll: () => void;
};

/** A fresh module registry: the layout, its mocked recordLaunch and the render helpers. */
function launch(): Launch {
  jest.resetModules();
  const helpers = require('./render/helpers');
  return {
    RootLayout: require('@/app/_layout').default,
    recordLaunch: require('@/lib/feedback/promptStore').recordLaunch,
    render: helpers.renderScreen,
    act: helpers.act,
    allText: helpers.allText,
    unmountAll: helpers.unmountAll,
  };
}

let current: Launch | null = null;
const flush = () => current!.act(async () => new Promise((r) => setImmediate(r)));
/** The provider tree rendered, and the error boundary did not swap in its fallback. */
const rendered = (tree: ReactTestRenderer) =>
  tree.toJSON() !== null && !current!.allText(tree).includes('Something went wrong');

afterEach(() => {
  current?.unmountAll();
  current = null;
});

test('recordLaunch runs once on mount, and a re-render or remount does not count again', async () => {
  current = launch();
  const { RootLayout, recordLaunch, render } = current;
  recordLaunch.mockResolvedValue(undefined);

  const tree = render(<RootLayout />);
  await flush();
  expect(recordLaunch).toHaveBeenCalledTimes(1);
  expect(rendered(tree)).toBe(true);

  await current.act(() => tree.update(<RootLayout />));
  await flush();
  expect(recordLaunch).toHaveBeenCalledTimes(1);

  render(<RootLayout />);
  await flush();
  expect(recordLaunch).toHaveBeenCalledTimes(1);
});

test('a failed recordLaunch never blocks the app', async () => {
  current = launch();
  const { RootLayout, recordLaunch, render } = current;
  recordLaunch.mockRejectedValue(new Error('storage unavailable'));

  const tree = render(<RootLayout />);
  await flush();
  expect(recordLaunch).toHaveBeenCalledTimes(1);
  expect(rendered(tree)).toBe(true);
});
