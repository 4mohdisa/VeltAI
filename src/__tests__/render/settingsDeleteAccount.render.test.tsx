// PHASE4_ROWS.md Row 4: the Settings Delete account flow. It confirms before
// any call (and warns that a subscription is not cancelled), Cancel makes no
// call, confirming calls DELETE /api/profile once, success hands off to the
// ACCOUNT_DELETED sign-out purge, and a 502 shows the error and keeps the
// user signed in. The API client is mocked, not the screen.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import DeleteAccountScreen from '@/app/profile/delete-account';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

const mockDelete = jest.fn();
const mockDispatch = jest.fn();
const mockGoBack = jest.fn();
const mockShowToast = jest.fn();

jest.mock('@/lib/api', () => ({
  api: { profile: { delete: () => mockDelete() } },
  ApiError: jest.requireActual('@/lib/api').ApiError,
}));

jest.mock('@/lib/auth/appState', () => ({
  useAppState: () => ({ dispatch: mockDispatch }),
}));

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useNavigation: () => ({ addListener: () => () => undefined, goBack: mockGoBack }),
}));

jest.mock('@/components/display/toastStore', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

function render() {
  return renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <DeleteAccountScreen />
    </SafeAreaProvider>,
  );
}

type Tree = ReturnType<typeof render>;

function press(tree: Tree, title: string) {
  act(() => {
    (buttonWithTitle(tree, title)!.props.onPress as () => void)();
  });
}

/** Steps through both confirmations and types DELETE; returns the final press. */
function reachFinalStep(tree: Tree): () => Promise<void> {
  press(tree, 'Continue');
  press(tree, 'I understand, continue');
  const field = findAll(tree, (p) => p.placeholder === 'DELETE' && typeof p.onChangeText === 'function')[0];
  act(() => {
    (field.props.onChangeText as (v: string) => void)('DELETE');
  });
  return async () => {
    await act(async () => {
      (buttonWithTitle(tree, 'Delete account')!.props.onPress as () => void)();
    });
  };
}

beforeEach(() => {
  mockDelete.mockReset();
  mockDispatch.mockReset();
  mockGoBack.mockReset();
  mockShowToast.mockReset();
});

test('confirmation comes first, and the subscription warning before the final step', () => {
  const tree = render();
  expect(allText(tree)).toContain('This permanently deletes your account and all of your data');
  expect(mockDelete).not.toHaveBeenCalled();
  press(tree, 'Continue');
  expect(allText(tree)).toContain('does not cancel an active subscription');
  expect(allText(tree)).toContain('Subscriptions');
  expect(mockDelete).not.toHaveBeenCalled();
});

test('Cancel leaves without calling the API', () => {
  const tree = render();
  press(tree, 'Cancel');
  expect(mockGoBack).toHaveBeenCalledTimes(1);
  expect(mockDelete).not.toHaveBeenCalled();
});

test('confirming calls DELETE /api/profile once and success signs out', async () => {
  mockDelete.mockResolvedValue({ deleted: true });
  const tree = render();
  await reachFinalStep(tree)();
  expect(mockDelete).toHaveBeenCalledTimes(1);
  expect(mockDispatch).toHaveBeenCalledWith({ type: 'ACCOUNT_DELETED' });
});

test('a 502 shows the error and does not sign out', async () => {
  const { ApiError } = jest.requireActual<typeof import('@/lib/api')>('@/lib/api');
  mockDelete.mockRejectedValue(new ApiError(502, 'could not delete the account with the sign-in provider — try again'));
  const tree = render();
  await reachFinalStep(tree)();
  expect(mockDelete).toHaveBeenCalledTimes(1);
  expect(mockShowToast).toHaveBeenCalledWith(
    expect.objectContaining({ tone: 'error', message: expect.stringContaining('could not delete the account') }),
  );
  expect(mockDispatch).not.toHaveBeenCalled();
  expect(buttonWithTitle(tree, 'Delete account')!.props.loading).toBe(false);
});
