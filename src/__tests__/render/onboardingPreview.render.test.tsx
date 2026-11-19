// Onboarding "Preview" step — reflects the user's answers back as insight
// cards, then the account CTA. These EXECUTE the screen; they are not
// source-text greps.
import PreviewScreen from '@/app/onboarding/preview';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => false) }));

beforeEach(() => {
  useOnboardingStore.getState().reset();
  (useReduceMotion as jest.Mock).mockReturnValue(false);
});

test('the headline renders', () => {
  const tree = renderScreen(<PreviewScreen />);
  expect(allText(tree)).toContain("Here's what Lume knows about you already");
});

test('pressing the account CTA navigates to the next onboarding route', () => {
  const tree = renderScreen(<PreviewScreen />);
  const cta = buttonWithTitle(tree, 'Create my account →');
  act(() => (cta!.props.onPress as () => void)());

  const { router } = require('expo-router') as { router: { push: jest.Mock } };
  expect(router.push).toHaveBeenCalledWith('/onboarding/signup');
});
