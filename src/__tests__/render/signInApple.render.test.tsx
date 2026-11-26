// Row 3: Sign in with Apple on the Clerk sign up screen. The Apple button
// shows on iOS only, starts useSSO with oauth_apple once per press, a
// cancelled flow leaves the screen on its buttons step, and a failed flow
// shows the same error toast the Google button uses. Clerk is mocked.
import { Platform } from 'react-native';

import SignupScreen from '@/app/onboarding/signup';
import { useToastStore } from '@/components/display/toastStore';
import en from '@/lib/i18n/locales/en.json';
import { act, buttonWithTitle, renderScreen, screenTitle } from './helpers';

jest.mock('@/lib/auth/clerkEnv', () => ({
  isClerkEnabled: () => true,
}));

const mockStartSSOFlow = jest.fn();
const mockSetActive = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: (...args: unknown[]) => mockStartSSOFlow(...args) }),
  useSignUp: () => ({ signUp: undefined, setActive: jest.fn(), isLoaded: true }),
  useSignIn: () => ({ signIn: undefined, setActive: jest.fn(), isLoaded: true }),
}));

const apple = en.signup.continueApple;
const google = en.signup.continueGoogle;

async function press(tree: ReturnType<typeof renderScreen>, title: string) {
  await act(async () => {
    (buttonWithTitle(tree, title)!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });
}

beforeEach(() => {
  mockStartSSOFlow.mockReset();
  mockSetActive.mockReset();
  useToastStore.getState().dismiss();
  jest.replaceProperty(Platform, 'OS', 'ios');
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('iOS shows the Apple button beside Google', () => {
  const tree = renderScreen(<SignupScreen />);
  expect(buttonWithTitle(tree, apple)).toBeDefined();
  expect(buttonWithTitle(tree, google)).toBeDefined();
});

test('Android hides the Apple button and keeps Google', () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  const tree = renderScreen(<SignupScreen />);
  expect(buttonWithTitle(tree, apple)).toBeUndefined();
  expect(buttonWithTitle(tree, google)).toBeDefined();
});

test('pressing Apple starts the oauth_apple flow once', async () => {
  mockStartSSOFlow.mockResolvedValue({ createdSessionId: undefined, setActive: mockSetActive });
  const tree = renderScreen(<SignupScreen />);
  await press(tree, apple);
  expect(mockStartSSOFlow).toHaveBeenCalledTimes(1);
  expect(mockStartSSOFlow).toHaveBeenCalledWith({ strategy: 'oauth_apple' });
});

test('a cancelled Apple flow leaves the screen unchanged', async () => {
  mockStartSSOFlow.mockResolvedValue({ createdSessionId: undefined, setActive: mockSetActive });
  const tree = renderScreen(<SignupScreen />);
  const title = screenTitle(tree);
  await press(tree, apple);
  expect(screenTitle(tree)).toBe(title);
  expect(buttonWithTitle(tree, apple)).toBeDefined();
  expect(buttonWithTitle(tree, google)).toBeDefined();
  expect(mockSetActive).not.toHaveBeenCalled();
});

test('a failed Apple flow shows the same error toast as Google', async () => {
  const failure = { errors: [{ code: 'form_identifier_exists', message: 'raw' }] };
  mockStartSSOFlow.mockRejectedValue(failure);
  const tree = renderScreen(<SignupScreen />);

  await press(tree, apple);
  const appleToast = useToastStore.getState().current;
  expect(appleToast).toMatchObject({ tone: 'error' });

  useToastStore.getState().dismiss();
  await press(tree, google);
  expect(useToastStore.getState().current).toMatchObject({ message: appleToast!.message, tone: 'error' });
});
