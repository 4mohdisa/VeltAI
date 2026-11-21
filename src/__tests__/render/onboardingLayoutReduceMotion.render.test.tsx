// Onboarding stack Reduce Motion (PHASE2_ROWS.md row 74 follow-up) — the
// onboarding stack (src/app/onboarding/_layout.tsx) used to hardcode
// animation: 'slide_from_right' with no Reduce Motion branch, unlike the root
// stack's screenAnimation() helper (src/app/_layout.tsx) and ProgressBar
// (src/components/display/ProgressBar.tsx), both of which read the same
// useReduceMotion() hook. This mounts the real layout component and checks
// both branches reach the Stack's screenOptions.
import OnboardingLayout from '@/app/onboarding/_layout';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { findAll, renderScreen } from './helpers';

// expo-router's real Stack is a navigator that needs a router context this
// render environment doesn't provide (the shared mock in render/setup.ts only
// stubs router/useLocalSearchParams/usePathname, since no other render test
// has mounted a _layout.tsx file before). A plain function component is
// enough: OnboardingLayout's own logic (the hook call, the ternary, the props
// it hands Stack) still runs for real; only the navigator itself is a stand-in.
jest.mock('expo-router', () => ({ Stack: () => null }));

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn() }));

const stackAnimation = (tree: ReturnType<typeof renderScreen>) =>
  (findAll(tree, (p) => 'screenOptions' in p)[0].props as { screenOptions: { animation?: string } }).screenOptions
    .animation;

test('Reduce Motion off keeps the current slide animation', () => {
  (useReduceMotion as jest.Mock).mockReturnValue(false);
  const tree = renderScreen(<OnboardingLayout />);
  expect(stackAnimation(tree)).toBe('slide_from_right');
});

test('Reduce Motion on drops the slide to no animation', () => {
  (useReduceMotion as jest.Mock).mockReturnValue(true);
  const tree = renderScreen(<OnboardingLayout />);
  expect(stackAnimation(tree)).toBe('none');
});
