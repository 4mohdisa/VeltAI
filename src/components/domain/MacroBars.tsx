// MacroBars — protein / carbs / fat (and optionally fibre) progress bars that
// sit beside the calorie ring. Each row: label, bar, "consumed / target g".
import { View } from 'react-native';

import { ProgressBar } from '@/components/display/ProgressBar';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import type { MacroProgress } from '@/lib/mock/data';

type Row = { label: string; data: MacroProgress };

export type MacroBarsProps = {
  rows: Row[];
};

export function MacroBars({ rows }: MacroBarsProps) {
  return (
    <View style={{ gap: space.md }}>
      {rows.map(({ label, data }) => {
        const over = data.consumed > data.target;
        return (
          <View key={label} style={{ gap: space.xs }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="footnote" color={color.gray700}>
                {label}
              </Text>
              <Text variant="footnote" color={over ? color.gray700 : color.gray500}>
                {Math.round(data.consumed)} / {Math.round(data.target)} g
              </Text>
            </View>
            <ProgressBar
              value={data.target > 0 ? data.consumed / data.target : 0}
              tint={over ? color.black : color.black}
            />
          </View>
        );
      })}
    </View>
  );
}
