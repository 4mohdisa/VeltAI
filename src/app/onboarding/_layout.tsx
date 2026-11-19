// Backend-wired onboarding stack. Headerless — each screen renders its own back
// control + progress dots via OnbScaffold. Forward pushes slide from the right;
// back navigation slides left automatically. Under Reduce Motion (HIG §7.3),
// same check as the root stack (src/app/_layout.tsx) and ProgressBar, the slide
// drops to no animation rather than keep sliding.
import { Stack } from 'expo-router';

import { color } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';

export default function OnboardingLayout() {
  const reduceMotion = useReduceMotion();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: reduceMotion ? 'none' : 'slide_from_right',
        contentStyle: { backgroundColor: color.white },
      }}
    />
  );
}
