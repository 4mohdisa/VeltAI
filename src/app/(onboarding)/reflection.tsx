// A7 · Reflection
// No inputs. Pure copy that mirrors back what they picked on A4. The most
// important screen in onboarding — generous whitespace, just Continue.
import { View } from 'react-native';

import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { useOnboarding } from '@/lib/onboarding/store';

const REFLECTIONS: Record<string, string> = {
  motivation: "You have the motivation — you're here.",
  time: 'Your day is full. We work within it, not against it.',
  energy: 'We plan around your energy, not against it.',
  knowledge: "You don't have to figure this out. That's our job.",
  intimidation: "You don't need to know everything to start.",
  'food-noise': 'Your food log takes 5 seconds, not 5 minutes.',
  injury: 'We start gently and build at your pace.',
};

export default function ReflectionScreen() {
  const struggles = useOnboarding((s) => s.struggles);
  const lines = struggles.map((s) => REFLECTIONS[s]).filter(Boolean).slice(0, 3);
  if (lines.length === 0) lines.push('You have the motivation — you’re here.');

  return (
    <OnboardingStep step={7} scroll={false} continueLabel="Let's set you up">
      <View style={{ flex: 1, justifyContent: 'center', gap: space.xl }}>
        <Text variant="title1" color={color.black}>
          Okay. Here&apos;s what we hear.
        </Text>
        <Text variant="title3" color={color.gray700}>
          You don&apos;t have the system that works for you yet. Most apps add one more thing to
          remember — we remove the friction instead.
        </Text>
        <View style={{ gap: space.md }}>
          {lines.map((line) => (
            <View key={line} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
              <Text variant="body" color={color.accent}>
                •
              </Text>
              <Text variant="body" color={color.gray900} style={{ flex: 1 }}>
                {line}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </OnboardingStep>
  );
}
