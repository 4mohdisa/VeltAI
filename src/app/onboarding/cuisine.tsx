// Cuisine — multi-select 2-col grid of emoji tiles. Drives which foods the
// backend pre-seeds; at least one is required to continue.
import { View } from 'react-native';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { CUISINE_OPTIONS } from '@/components/onboarding/cuisines';
import { Button } from '@/components/forms';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { haptics } from '@/lib/haptics';
import { navigate } from '@/lib/nav';
import { color, layout, radius, space } from '@/lib/design/tokens';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import type { CuisineType } from '@/lib/types';

export default function CuisineScreen() {
  const cuisines = useOnboardingStore((s) => s.cuisines);
  const setCuisines = useOnboardingStore((s) => s.setCuisines);

  const toggle = (value: CuisineType) => {
    haptics.selection();
    setCuisines(
      cuisines.includes(value) ? cuisines.filter((c) => c !== value) : [...cuisines, value],
    );
  };

  return (
    <OnbScaffold
      step={3}
      scroll
      title="What do you usually eat?"
      subtitle="Select all that apply"
      footer={
        <Button
          title="Continue"
          disabled={cuisines.length === 0}
          onPress={() => navigate('/onboarding/dietary')}
        />
      }
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {CUISINE_OPTIONS.map((c) => {
          const selected = cuisines.includes(c.value);
          const fg = selected ? color.white : color.label;
          return (
            <Pressable
              key={c.value}
              onPress={() => toggle(c.value)}
              haptic={false}
              minTapTarget={false}
              accessibilityLabel={c.label}
              accessibilityState={{ selected }}
              style={{
                width: '47%',
                flexGrow: 1,
                gap: space.xs,
                paddingVertical: space.lg,
                paddingHorizontal: space.lg,
                borderRadius: radius.lg,
                borderWidth: layout.borderWidth,
                borderColor: selected ? color.black : color.gray300,
                backgroundColor: selected ? color.black : color.white,
              }}
            >
              <Text variant="title3">{c.emoji}</Text>
              <Text variant="bodyMedium" color={fg}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnbScaffold>
  );
}
