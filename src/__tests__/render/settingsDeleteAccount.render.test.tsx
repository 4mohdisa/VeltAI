// PHASE4_ROWS.md Row 4: the Settings Delete account flow. It confirms before
// any call (and warns that a subscription is not cancelled), Cancel makes no
// call, confirming calls DELETE /api/profile once, success hands off to the
// ACCOUNT_DELETED sign-out purge, and a 502 shows a plain error and keeps the
// user signed in. The subscription note links to Apple's subscription settings,
// and the final step's prompt shows DELETE in bold. The API client
// is mocked, not the screen.
import { Linking, StyleSheet } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import DeleteAccountScreen from '@/app/profile/delete-account';
import { type } from '@/lib/design/tokens';
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

/** The text a node renders, its nested Text children joined in order. */
function textOf(node: ReactTestInstance): string {
  return node.children.map((c) => (typeof c === 'string' ? c : textOf(c))).join('');
}

/** Host nodes (the rendered element, not the AppText wrapper) that read exactly `text`. */
function hostTextsReading(root: ReactTestInstance, text: string): ReactTestInstance[] {
  return root.findAll((n) => typeof n.type === 'string' && textOf(n) === text);
}

const fontWeightOf = (node: ReactTestInstance) => StyleSheet.flatten(node.props.style).fontWeight;

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

test('the subscription note links to Apple subscription settings', () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  const tree = render();
  press(tree, 'Continue');
  expect(allText(tree)).toContain('Deleting your account does not cancel an active subscription.');
  press(tree, 'Manage subscription');
  expect(openURL).toHaveBeenCalledWith('https://apps.apple.com/account/subscriptions');
  expect(mockDelete).not.toHaveBeenCalled();
  openURL.mockRestore();
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

test('a 502 shows a plain error, never the server text, and does not sign out', async () => {
  const { ApiError } = jest.requireActual<typeof import('@/lib/api')>('@/lib/api');
  mockDelete.mockRejectedValue(new ApiError(502, 'could not delete the account with the sign-in provider — try again'));
  const tree = render();
  await reachFinalStep(tree)();
  expect(mockDelete).toHaveBeenCalledTimes(1);
  expect(mockShowToast).toHaveBeenCalledWith({
    message: "Couldn't delete your account. Check your connection and try again.",
    tone: 'error',
  });
  expect(mockDispatch).not.toHaveBeenCalled();
  expect(buttonWithTitle(tree, 'Delete account')!.props.loading).toBe(false);
});

test('the final step asks to type DELETE, with only DELETE in bold', () => {
  const tree = render();
  press(tree, 'Continue');
  press(tree, 'I understand, continue');
  const [prompt] = hostTextsReading(tree.root, 'Type DELETE to confirm.');
  expect(prompt).toBeDefined();
  const word = hostTextsReading(prompt, 'DELETE');
  expect(word).toHaveLength(1);
  expect(fontWeightOf(word[0])).toBe(type.bodyBold.fontWeight);
  expect(fontWeightOf(prompt)).toBe(type.body.fontWeight);
});
