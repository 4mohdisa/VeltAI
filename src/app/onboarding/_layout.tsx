// Backend-wired onboarding stack. Headerless — each screen renders its own back
// control + progress dots via OnbScaffold. Forward pushes slide from the right;
// back navigation slides left automatically.
import { Stack } from 'expo-router';

import { color } from '@/lib/design/tokens';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: color.white },
      }}
    />
  );
}
