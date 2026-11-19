// Food "Quick add" screen (PHASE2_ROWS.md row 5 "Quick add") — no render test
// existed for this screen before. This EXECUTES the real screen; it is not a
// source-text grep. The first two tests below render-only, so no mock was
// needed for them. The submit-path tests mock add()'s three side-effect
// modules (api, offline queue, toast) the same way paywallOnboardingPost.render.test.tsx
// mocks @/lib/api — a jest.fn() the test controls per-case, not the live module.
import type { ReactTestRenderer } from 'react-test-renderer';
import QuickAddScreen from '@/app/food/quick-add';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

const mockQuickAdd = jest.fn();
const mockIsTransient = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { foodLogs: { quickAdd: (...args: unknown[]) => mockQuickAdd(...args) } },
  isTransient: (...args: unknown[]) => mockIsTransient(...args),
}));

const mockRunOrQueue = jest.fn();
jest.mock('@/lib/offline/queue', () => ({
  runOrQueue: (...args: unknown[]) => mockRunOrQueue(...args),
}));

const mockShowToast = jest.fn();
jest.mock('@/components/display/toastStore', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));

// The shared render/setup.ts mock always answers canGoBack() true. Row 5's
// deep-linked entry (no back stack) needs it false for one test, so this
// file overrides that one field with a jest.fn() the test can flip, keeping
// push/replace/back as the same kind of spy the shared mock uses.
const mockBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: (...args: unknown[]) => mockBack(...args), canGoBack: () => mockCanGoBack() },
  useLocalSearchParams: () => ({}),
  usePathname: () => '/food/quick-add',
  Href: {},
}));

async function pressAdd(): Promise<ReactTestRenderer> {
  const tree = renderScreen(<QuickAddScreen />);
  const button = buttonWithTitle(tree, 'Add 250 kcal')!;
  await act(async () => {
    (button.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

beforeEach(() => {
  mockQuickAdd.mockClear();
  mockIsTransient.mockClear();
  mockRunOrQueue.mockClear();
  mockShowToast.mockClear();
  mockBack.mockClear();
  mockCanGoBack.mockReturnValue(true);
});

test('renders the Quick add sheet title', () => {
  const tree = renderScreen(<QuickAddScreen />);
  expect(allText(tree)).toContain('Quick add');
});

test('starts on the kcal hero figure with its tap-to-type hint, not the number pad', () => {
  const tree = renderScreen(<QuickAddScreen />);
  const text = allText(tree);
  expect(text).toContain('kcal · tap to type');
  expect(text).toContain('250');
});

test('pressing Add while the API call fails transiently queues the write and does not show the error toast', async () => {
  mockQuickAdd.mockRejectedValueOnce(new Error('network request failed'));
  mockIsTransient.mockReturnValueOnce(true);
  mockRunOrQueue.mockResolvedValueOnce(null);

  await pressAdd();

  expect(mockRunOrQueue).toHaveBeenCalledTimes(1);
  expect(mockShowToast).toHaveBeenCalledTimes(1);
  expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ tone: 'success' }));
});

test('pressing Add while the API call fails permanently shows the error toast and does not enqueue', async () => {
  mockQuickAdd.mockRejectedValueOnce(new Error('Bad Request'));
  mockIsTransient.mockReturnValueOnce(false);

  await pressAdd();

  expect(mockShowToast).toHaveBeenCalledTimes(1);
  expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ tone: 'error' }));
  expect(mockRunOrQueue).not.toHaveBeenCalled();
});

test('while the add request is in flight, the submit control shows its loading state', async () => {
  // Never resolves within this test's lifetime: add() stays suspended on this
  // await, so submitting (and therefore the Button's loading prop) stays true
  // for as long as the assertion below needs it to.
  mockQuickAdd.mockImplementationOnce(() => new Promise(() => {}));

  const tree = await pressAdd();

  const button = buttonWithTitle(tree, 'Add 250 kcal')!;
  expect(button.props.loading).toBe(true);
});

test('pressing Add twice while the first request is still pending calls the API exactly once', async () => {
  // Never resolves within this test's lifetime, so the first add() is still
  // in flight (submitting stays true) when the second press fires.
  mockQuickAdd.mockImplementationOnce(() => new Promise(() => {}));

  const tree = await pressAdd();
  const button = buttonWithTitle(tree, 'Add 250 kcal')!;
  await act(async () => {
    (button.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(mockQuickAdd).toHaveBeenCalledTimes(1);
});

test('when router.canGoBack() is false, a successful add keeps the sheet open and does not navigate back', async () => {
  mockCanGoBack.mockReturnValue(false);
  mockQuickAdd.mockResolvedValueOnce({});

  const tree = await pressAdd();

  expect(mockBack).not.toHaveBeenCalled();
  expect(allText(tree)).toContain('Quick add');
});
