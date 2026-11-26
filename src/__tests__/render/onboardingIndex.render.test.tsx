// Welcome screen (PHASE2_ROWS.md row 2, onboarding step 1) — EXECUTES the
// real screen, not a source-text grep. No api call lives here (pure navigation
// chooser), so only expo-router's router (already mocked in
// src/__tests__/render/setup.ts) stands in for the real navigator. Clerk is
// mocked because Welcome imports useAuth: the real module keeps Jest from
// exiting. With no Clerk key in tests, Welcome never calls it.
import WelcomeScreen from '@/app/onboarding/index';
import { router } from 'expo-router';
import { allText, buttonWithTitle, renderScreen } from './helpers';

jest.mock('@clerk/clerk-expo', () => ({ useAuth: () => ({ isSignedIn: false }) }));

test('shows the welcome headline', () => {
  const tree = renderScreen(<WelcomeScreen />);
  expect(allText(tree)).toContain('Track your food the way you actually eat');
});

test('pressing Get Started routes to /onboarding/goal', () => {
  const tree = renderScreen(<WelcomeScreen />);

  (buttonWithTitle(tree, 'Get Started')!.props.onPress as () => void)();
  expect(router.push).toHaveBeenCalledWith('/onboarding/goal');
});
