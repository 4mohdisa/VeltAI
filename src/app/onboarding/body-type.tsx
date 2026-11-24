// Body type — single-select onboarding step (mirrors goal/activity: pick, fire a
// selection haptic, auto-advance after a beat). Each option carries an emoji + a
// description sub-line, so it uses a small local card instead of OptionCard
// (icon+label only). Reduce Motion → navigate immediately, no delay.
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { color, layout, radius, space } from '@/lib/design/tokens';
import { haptics } from '@/lib/haptics';
import { navigate } from '@/lib/nav';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import type { BodyType } from '@/lib/types';

const TYPES = [
  { value: 'skinny', emoji: '🦴', labelKey: 'onboarding.bodyType.skinny', descKey: 'onboarding.bodyType.skinnyDesc' },
  {
    value: 'skinny_fat',
    emoji: '🤷',
    labelKey: 'onboarding.bodyType.skinnyFat',
    descKey: 'onboarding.bodyType.skinnyFatDesc',
  },
  { value: 'average', emoji: '⚖️', labelKey: 'onboarding.bodyType.average', descKey: 'onboarding.bodyType.averageDesc' },
  {
    value: 'overweight',
    emoji: '🍔',
    labelKey: 'onboarding.bodyType.overweight',
    descKey: 'onboarding.bodyType.overweightDesc',
  },
  {
    value: 'muscular',
    emoji: '💪',
    labelKey: 'onboarding.bodyType.muscular',
    descKey: 'onboarding.bodyType.muscularDesc',
  },
] as const satisfies readonly { value: BodyType; emoji: string; labelKey: string; descKey: string }[];

function BodyCard({
  emoji,
  label,
  desc,
  selected,
  onPress,
}: {
  emoji: string;
  label: string;
  desc: string;
  selected: boolean;
  onPress: () => void;
}) {
  const fg = selected ? color.white : color.label;
  const sub = selected ? color.gray300 : color.secondaryLabel;
  return (
    <Pressable
      onPress={onPress}
      haptic={false}
      minTapTarget={false}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        width: '100%',
        minHeight: layout.buttonHeight + space.md,
        paddingVertical: space.lg,
        paddingHorizontal: space.xl,
        borderRadius: radius.lg,
        borderWidth: layout.borderWidth,
        borderColor: selected ? color.black : color.gray300,
        backgroundColor: selected ? color.black : color.white,
      }}
    >
      <Text style={{ fontSize: 26 }}>{emoji}</Text>
      <View style={{ flex: 1, gap: space.xs }}>
        <Text variant="bodyBold" color={fg}>
          {label}
        </Text>
        <Text variant="footnote" color={sub}>
          {desc}
        </Text>
      </View>
    </Pressable>
  );
}

export default function BodyTypeScreen() {
  const { t } = useTranslation();
  const bodyType = useOnboardingStore((s) => s.body_type);
  const setBodyType = useOnboardingStore((s) => s.setBodyType);
  const reduceMotion = useReduceMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const pick = (value: BodyType) => {
    setBodyType(value);
    haptics.selection();
    if (timer.current) clearTimeout(timer.current);
    if (reduceMotion) {
      navigate('/onboarding/targets');
      return;
    }
    timer.current = setTimeout(() => navigate('/onboarding/targets'), 300);
  };

  return (
    <OnbScaffold
      step={8}
      scroll
      title={t('onboarding.bodyType.title')}
      subtitle={t('onboarding.bodyType.subtitle')}
    >
      <View style={{ gap: space.md }}>
        {TYPES.map((type) => (
          <BodyCard
            key={type.value}
            emoji={type.emoji}
            label={t(type.labelKey)}
            desc={t(type.descKey)}
            selected={bodyType === type.value}
            onPress={() => pick(type.value)}
          />
        ))}
      </View>
    </OnbScaffold>
  );
}
