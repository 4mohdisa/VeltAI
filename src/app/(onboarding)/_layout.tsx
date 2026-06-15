// Onboarding stack — headerless because each onboarding screen renders its own
// progress indicator and Back affordance (we own the chrome). Swipe-back stays
// enabled so the flow is never modal-blocked (Bugs-to-Avoid: never trap the user).
import { Stack } from 'expo-router';

import { color } from '@/lib/design/tokens';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        contentStyle: { backgroundColor: color.white },
      }}
    />
  );
}
