// UncertaintyPromptCard — the accuracy moat. When the AI is unsure about an
// ingredient (e.g. how much oil), we ASK instead of silently guessing. Four
// options; a live calorie preview updates as the user selects.
import { View } from 'react-native';

import { Card } from '@/components/display/Card';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';
import { formatCalories } from '@/lib/formatting';
import type { UncertaintyPrompt } from '@/lib/mock/ai';

export type UncertaintyPromptCardProps = {
  prompt: UncertaintyPrompt;
  index: number;
  total: number;
  selectedLabel?: string;
  onSelect: (optionLabel: string) => void;
};

export function UncertaintyPromptCard({
  prompt,
  index,
  total,
  selectedLabel,
  onSelect,
}: UncertaintyPromptCardProps) {
  const selected = prompt.options.find((o) => o.label === selectedLabel);
  const previewKcal = prompt.baseKcal + (selected?.deltaKcal ?? 0);

  return (
    <Card>
      <View style={{ gap: space.md }}>
        <Text variant="footnote" color={color.gray500} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          Question {index + 1} of {total}
        </Text>
        <Text variant="title3" color={color.black}>
          {prompt.question}
        </Text>

        <View style={{ gap: space.sm }}>
          {prompt.options.map((opt) => {
            const isSelected = opt.label === selectedLabel;
            return (
              <Pressable
                key={opt.label}
                minTapTarget={false}
                haptic={false}
                onPress={() => onSelect(opt.label)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={opt.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: space.md,
                  paddingHorizontal: space.xl,
                  borderRadius: radius.pill,
                  minHeight: 52,
                  backgroundColor: isSelected ? color.black : color.gray100,
                }}
              >
                <Text variant="bodyMedium" color={isSelected ? color.white : color.gray800}>
                  {opt.label}
                </Text>
                <Text variant="footnote" color={isSelected ? color.white : color.gray500}>
                  {opt.deltaKcal === 0 ? '+0' : `+${opt.deltaKcal}`} kcal
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: space.sm,
            borderTopWidth: 1,
            borderTopColor: color.gray100,
          }}
        >
          <Text variant="footnote" color={color.gray500}>
            Estimated calories
          </Text>
          <Text variant="statSmall" color={color.black}>
            {formatCalories(previewKcal)}
          </Text>
        </View>
      </View>
    </Card>
  );
}
