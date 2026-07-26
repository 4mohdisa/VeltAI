// Body type — single-select onboarding step (mirrors goal/activity: pick, fire a
// selection haptic, auto-advance after a beat). Each option carries an emoji + a
// description sub-line, so it uses a small local card instead of OptionCard
// (icon+label only). Reduce Motion → navigate immediately, no delay.
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { color, layout, radius, space } from '@/lib/design/tokens';
import { haptics } from '@/lib/haptics';
import { navigate } from '@/lib/nav';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import type { BodyType } from '@/lib/types';

const TYPES: { value: BodyType; emoji: string; label: string; desc: string }[] = [
  { value: 'skinny', emoji: '🦴', label: 'Skinny', desc: 'Low body fat, low muscle mass' },
  { value: 'skinny_fat', emoji: '🤷', label: 'Skinny Fat', desc: 'Low muscle, higher body fat' },
  { value: 'average', emoji: '⚖️', label: 'Average', desc: 'Typical build, room to improve' },
  { value: 'overweight', emoji: '🍔', label: 'Overweight', desc: 'Higher body fat, looking to lose weight' },
  { value: 'muscular', emoji: '💪', label: 'Muscular / Athletic', desc: 'Good muscle, focused on performance' },
];

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
      title="What does your body look like right now?"
      subtitle="Be honest — this helps set the right starting point"
    >
      <View style={{ gap: space.md }}>
        {TYPES.map((t) => (
          <BodyCard
            key={t.value}
            emoji={t.emoji}
            label={t.label}
            desc={t.desc}
            selected={bodyType === t.value}
            onPress={() => pick(t.value)}
          />
        ))}
      </View>
    </OnbScaffold>
  );
}
