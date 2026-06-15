// A1 · Welcome
// The only black-background screen, for impact. Logo centred, single tagline,
// Continue at the bottom. No progress bar, no back (this is the entry).
import { View } from 'react-native';

import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';

export default function WelcomeScreen() {
  return (
    <OnboardingStep step={1} dark hideProgress showBack={false} scroll={false} continueLabel="Get started">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg }}>
        <Text variant="display" color={color.white}>
          Veltai
        </Text>
        <Text variant="title3" color={color.gray300} style={{ textAlign: 'center' }}>
          Make going to the gym the easy choice.
        </Text>
      </View>
    </OnboardingStep>
  );
}
