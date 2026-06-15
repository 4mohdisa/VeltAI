// OnboardingStep — shared chrome for the 19 onboarding screens: progress
// indicator ("Step X of 19"), an always-available Back button (never modal-
// blocked), optional Skip, title/subtitle, scrolling body, and a Continue
// footer. Default Continue advances to the next route and persists the step so
// the flow can resume. A1 uses the dark variant (the only black screen).
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { BackButton } from '@/components/navigation/BackButton';
import { Button } from '@/components/forms/Button';
import { ProgressBar } from '@/components/display/ProgressBar';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { setOnboardingStep } from '@/lib/storage/secureStore';
import { ONBOARDING_TOTAL, nextOnboardingRoute } from '@/lib/onboarding/steps';

export type OnboardingStepProps = {
  step: number;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  continueLabel?: string;
  continueDisabled?: boolean;
  onContinue?: () => void;
  onSkip?: () => void;
  showBack?: boolean;
  scroll?: boolean;
  dark?: boolean;
  hideProgress?: boolean;
  hideContinue?: boolean;
};

export function OnboardingStep({
  step,
  title,
  subtitle,
  children,
  continueLabel = 'Continue',
  continueDisabled,
  onContinue,
  onSkip,
  showBack = true,
  scroll = true,
  dark = false,
  hideProgress = false,
  hideContinue = false,
}: OnboardingStepProps) {
  const bg = dark ? color.black : color.white;
  const titleColor = dark ? color.white : color.black;
  const subtitleColor = dark ? color.gray300 : color.gray500;

  const advance = () => {
    if (onContinue) {
      onContinue();
      return;
    }
    const route = nextOnboardingRoute(step);
    if (route) {
      setOnboardingStep(route);
      router.push(route as never);
    }
  };

  const Body = (
    <View style={{ gap: space.lg, flex: scroll ? undefined : 1 }}>
      {title ? (
        <Text variant="title1" color={titleColor}>
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text variant="callout" color={subtitleColor}>
          {subtitle}
        </Text>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'bottom']}>
      {/* Top bar: back + progress + skip */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.sm, paddingTop: space.xs }}>
        <View style={{ width: 44 }}>{showBack ? <BackButton tint={dark ? color.white : color.black} /> : null}</View>
        <View style={{ flex: 1 }}>
          {!hideProgress ? (
            <ProgressBar
              value={step / ONBOARDING_TOTAL}
              track={dark ? color.gray700 : color.gray200}
              height={6}
            />
          ) : null}
        </View>
        <View style={{ width: 44, alignItems: 'flex-end' }}>
          {onSkip ? (
            <Pressable onPress={onSkip} haptic={false} accessibilityLabel="Skip">
              <Text variant="footnote" color={dark ? color.gray300 : color.gray500}>
                Skip
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {!hideProgress ? (
        <Text
          variant="caption"
          color={dark ? color.gray400 : color.gray400}
          style={{ textAlign: 'center', marginTop: space.xs }}
        >
          Step {step} of {ONBOARDING_TOTAL}
        </Text>
      ) : null}

      {scroll ? (
        <ScrollView
          contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xl }}
          keyboardShouldPersistTaps="handled"
        >
          {Body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, padding: space.lg }}>{Body}</View>
      )}

      {!hideContinue ? (
        <View style={{ padding: space.lg }}>
          <Button title={continueLabel} onPress={advance} disabled={continueDisabled} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
