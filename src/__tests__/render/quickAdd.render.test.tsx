// Food "Quick add" screen (PHASE2_ROWS.md row 5 "Quick add") — no render test
// existed for this screen before. This EXECUTES the real screen; it is not a
// source-text grep. The first two tests below render-only, so no mock was
// needed for them. The submit-path tests mock add()'s three side-effect
// modules (api, offline queue, toast) the same way paywallOnboardingPost.render.test.tsx
// mocks @/lib/api — a jest.fn() the test controls per-case, not the live module.
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

async function pressAdd(): Promise<void> {
  const tree = renderScreen(<QuickAddScreen />);
  const button = buttonWithTitle(tree, 'Add 250 kcal')!;
  await act(async () => {
    (button.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });
}

beforeEach(() => {
  mockQuickAdd.mockClear();
  mockIsTransient.mockClear();
  mockRunOrQueue.mockClear();
  mockShowToast.mockClear();
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
