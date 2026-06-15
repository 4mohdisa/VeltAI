// A3 · Sign in / sign up
// Clerk-provided UI in production. Sign in with Apple prominent at top, email
// equal-sized below, existing-account link at the bottom. (Mocked — any button
// continues into the questions.)
import { View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';
import { onboardingHref } from '@/lib/onboarding/steps';

function AuthButton({
  icon,
  label,
  dark,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  dark?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      minTapTarget={false}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.sm,
        minHeight: 52,
        borderRadius: radius.md,
        backgroundColor: dark ? color.black : color.white,
        borderWidth: 1,
        borderColor: color.black,
      }}
    >
      <Ionicons name={icon} size={20} color={dark ? color.white : color.black} />
      <Text variant="bodyBold" color={dark ? color.white : color.black}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function AuthScreen() {
  const next = () => router.push(onboardingHref('struggles') as never);

  return (
    <OnboardingStep step={3} title="Create your account" subtitle="14 days free. No charge until your trial ends." hideContinue>
      <View style={{ gap: space.md, marginTop: space.lg }}>
        <AuthButton icon="logo-apple" label="Sign in with Apple" dark onPress={next} />
        <AuthButton icon="mail-outline" label="Continue with email" onPress={next} />
        <AuthButton icon="logo-google" label="Continue with Google" onPress={next} />
      </View>

      <Pressable onPress={next} haptic={false} accessibilityLabel="I already have an account" style={{ alignItems: 'center', padding: space.md }}>
        <Text variant="callout" color={color.accentText}>
          I already have an account
        </Text>
      </Pressable>
    </OnboardingStep>
  );
}
