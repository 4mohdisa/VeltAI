import '@/lib/i18n';

// Render-test setup. These tests mount real React Native components through
// react-test-renderer (jest-expo preset), so they exercise the actual JSX
// branches — unlike the node-env suite, which can only read source text.
// expo-router is a navigation container the screens import for `router.push`.
// Render tests assert what a screen RENDERS and what it CALLS, not where the
// navigator goes, so the router is a spy.
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  usePathname: () => '/onboarding/measurements',
  Href: {},
}));

// Mirror the REAL surface of @/lib/haptics, every member of it. A partial mock
// is a tripwire: a component that fires a haptic the mock happens not to define
// throws at render, so the test fails for a reason that has nothing to do with
// what it was checking. (This mock previously carried `impact`, which the module
// does not export, and lacked the three `impact*` members that it does.)
jest.mock('@/lib/haptics', () => ({
  haptics: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    selection: jest.fn(),
    impactLight: jest.fn(),
    impactMedium: jest.fn(),
    impactHeavy: jest.fn(),
  },
}));

// Reanimated is mocked via the root __mocks__ directory (jest picks that up
// automatically for node_modules packages).

// expo-secure-store backs the persisted onboarding store (see the node suite's
// mock); render tests need the same in-memory stand-in.
jest.mock('expo-secure-store', () => require('../mocks/expoSecureStore'));

// The router spy is shared by every test in a file, so clear its calls first;
// otherwise a route asserted in one test could have been pushed by another.
// Resolved here, not imported at the top: a top-level import would load this
// file's mock before a test file's own jest.mock('expo-router') could replace
// it. Those local mocks may omit router or wrap a spy in a plain function, so
// only real mock functions are cleared.
beforeEach(() => {
  const { router } = jest.requireMock<Partial<typeof import('expo-router')>>('expo-router');
  for (const fn of [router?.push, router?.replace, router?.back]) {
    if (jest.isMockFunction(fn)) fn.mockClear();
  }
});

// Tear every rendered tree down between tests. A tree left mounted stays
// subscribed to the zustand stores and keeps writing to them, which poisons
// the next test's fixture.
afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { unmountAll } = require('./helpers') as { unmountAll: () => void };
  unmountAll();
});
