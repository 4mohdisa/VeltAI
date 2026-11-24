// Welcome — the entry screen. No back, no progress. Wordmark, headline, a single
// Get Started CTA, plus a Sign in link so a returning user skips the questions
// and lands on the auth screen in sign-in mode.
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { Button } from '@/components/forms';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { navigate } from '@/lib/nav';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  return (
    <OnbScaffold
      showBack={false}
      showProgress={false}
      footer={
        <View style={{ gap: space.sm }}>
          <Button title={t('onboarding.welcomeGetStarted')} onPress={() => navigate('/onboarding/goal')} />
          <Pressable accessibilityRole="link" onPress={() => navigate('/onboarding/signup?mode=signin')}>
            <Text variant="footnote" color={color.label} style={{ textAlign: 'center' }}>
              {t('onboarding.welcomeSignIn')}
            </Text>
          </Pressable>
        </View>
      }
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl }}>
        <Text variant="title2" color={color.label}>
          Lume
        </Text>
        <Text variant="display" color={color.label} style={{ textAlign: 'center' }}>
          {t('onboarding.welcomeHeadline')}
        </Text>
        <Text variant="body" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
          {t('onboarding.welcomeSubline')}
        </Text>
      </View>
    </OnbScaffold>
  );
}
