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

jest.mock('@/lib/haptics', () => ({ haptics: { selection: jest.fn(), impact: jest.fn(), success: jest.fn() } }));

// Reanimated is mocked via the root __mocks__ directory (jest picks that up
// automatically for node_modules packages).

// expo-secure-store backs the persisted onboarding store (see the node suite's
// mock); render tests need the same in-memory stand-in.
jest.mock('expo-secure-store', () => require('../mocks/expoSecureStore'));
