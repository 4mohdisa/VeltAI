// OnbScaffold — the per-screen chrome for the backend-wired onboarding flow:
// safe-area top+bottom, an optional back circle + progress dots row, a title +
// subtitle, the screen body, and a sticky footer slot for the CTA. Deliberately
// NOT the old OnboardingStep (which is bound to the legacy 19-step steps.ts).
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressDots } from './ProgressDots';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

export type OnbScaffoldProps = {
  step?: number;
  totalSteps?: number;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showProgress?: boolean;
  onBack?: () => void;
  footer?: ReactNode;
  scroll?: boolean;
  dark?: boolean;
  children: ReactNode;
};

export function OnbScaffold({
  step = 1,
  totalSteps = 10,
  title,
  subtitle,
  showBack = true,
  showProgress = true,
  onBack,
  footer,
  scroll = false,
  dark = false,
  children,
}: OnbScaffoldProps) {
  const bg = dark ? color.black : color.white;
  const titleColor = dark ? color.white : color.label;
  const subtitleColor = dark ? color.gray300 : color.secondaryLabel;
  const handleBack = onBack ?? (() => router.back());

  const header = (
    <>
      {(showBack || showProgress) && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md,
            marginBottom: space.xl,
          }}
        >
          {showBack ? (
            <Pressable
              onPress={handleBack}
              accessibilityLabel="Go back"
              minTapTarget={false}
              style={{
                width: 36,
                height: 36,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: dark ? color.gray2 : color.light1,
              }}
            >
              <Icon name="chevron-back" size={20} color={dark ? color.white : color.label} />
            </Pressable>
          ) : (
            <View style={{ width: 36, height: 36 }} />
          )}
          {showProgress ? (
            <View style={{ flex: 1, alignItems: 'center', paddingRight: 36 }}>
              <ProgressDots current={step} total={totalSteps} />
            </View>
          ) : null}
        </View>
      )}
      {title ? (
        <Text variant="title1" color={titleColor}>
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text variant="callout" color={subtitleColor} style={{ marginTop: space.sm }}>
          {subtitle}
        </Text>
      ) : null}
    </>
  );

  const bodyPad = { paddingHorizontal: space.xl };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'bottom']}>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ ...bodyPad, paddingTop: space.md, paddingBottom: space['2xl'] }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {header}
          <View style={{ marginTop: title || subtitle ? space['2xl'] : space.lg }}>{children}</View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, ...bodyPad, paddingTop: space.md }}>
          {header}
          <View style={{ flex: 1, marginTop: title || subtitle ? space['2xl'] : space.lg }}>
            {children}
          </View>
        </View>
      )}
      {footer ? (
        <View style={{ ...bodyPad, paddingTop: space.md, paddingBottom: space.sm }}>{footer}</View>
      ) : null}
    </SafeAreaView>
  );
}
