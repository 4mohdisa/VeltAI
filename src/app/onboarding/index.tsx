// Welcome — the entry screen. No back, no progress. Wordmark, headline, a single
// Get Started CTA. No sign-up here; auth comes after the value pitch.
import { View } from 'react-native';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { Button } from '@/components/forms';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { navigate } from '@/lib/nav';

export default function WelcomeScreen() {
  return (
    <OnbScaffold
      showBack={false}
      showProgress={false}
      footer={<Button title="Get Started" onPress={() => navigate('/onboarding/goal')} />}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl }}>
        <Text variant="title2" color={color.label}>
          Lume
        </Text>
        <Text variant="display" color={color.label} style={{ textAlign: 'center' }}>
          Track your food the way you actually eat
        </Text>
        <Text variant="body" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
          Personalised to your diet, your culture, your goals
        </Text>
      </View>
    </OnbScaffold>
  );
}
