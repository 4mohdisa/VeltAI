// AppleSignInButton draws the shared primary Button with the Apple label on
// iOS and nothing elsewhere. Clerk is mocked so a press can never reach Apple:
// the button only calls the onPress it was given.
import { Platform } from 'react-native';

import { AppleSignInButton } from '@/components/onboarding/AppleSignInButton';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

const mockStartSSOFlow = jest.fn();
const mockStartAppleFlow = jest.fn();
jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: mockStartSSOFlow }),
  useSignInWithApple: () => ({ startAppleAuthenticationFlow: mockStartAppleFlow }),
}));

const label = en.signup.continueApple;

function onIOS() {
  jest.replaceProperty(Platform, 'OS', 'ios');
}

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders the Apple label and calls onPress, never Clerk', () => {
  onIOS();
  const onPress = jest.fn();
  const tree = renderScreen(<AppleSignInButton onPress={onPress} />);
  expect(allText(tree)).toContain(label);
  act(() => {
    (buttonWithTitle(tree, label)?.props.onPress as () => void)();
  });
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(mockStartSSOFlow).not.toHaveBeenCalled();
  expect(mockStartAppleFlow).not.toHaveBeenCalled();
});

test('disabled blocks the press', () => {
  onIOS();
  const tree = renderScreen(<AppleSignInButton onPress={jest.fn()} disabled />);
  expect(findAll(tree, (p) => p.accessibilityLabel === label && p.disabled === true).length).toBeGreaterThan(0);
});

test('loading shows a spinner in place of the label and blocks the press', () => {
  onIOS();
  const tree = renderScreen(<AppleSignInButton onPress={jest.fn()} loading />);
  expect(findAll(tree, (p) => p.children === label)).toHaveLength(0);
  expect(
    findAll(tree, (p) => p.accessibilityLabel === label && (p.accessibilityState as { busy?: boolean })?.busy === true)
      .length,
  ).toBeGreaterThan(0);
});

test.each(['android', 'web'] as const)('renders nothing on %s', (os) => {
  jest.replaceProperty(Platform, 'OS', os);
  const tree = renderScreen(<AppleSignInButton onPress={jest.fn()} />);
  expect(tree.toJSON()).toBeNull();
});
