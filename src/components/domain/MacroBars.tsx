// MacroBars — protein / carbs / fat (+ fibre) progress bars. Each macro carries
// its category accent on its small icon and its progress bar ONLY — the label,
// value number, and track stay monochrome (functional colour, not decoration).
import { View } from 'react-native';

import { Icon } from '@/components/primitives/Icon';
import { ProgressBar } from '@/components/display/ProgressBar';
import { Text } from '@/components/primitives/Text';
import { categoryAccent, color, space } from '@/lib/design/tokens';
import type { MacroProgress } from '@/lib/mock/data';

export type MacroStyleKey = 'Protein' | 'Carbs' | 'Fat' | 'Fibre';

// `label` is display text (translatable); `macroKey` is the stable style key so
// the accent/icon lookup survives translation. Defaults to label for back-compat.
type Row = { label: string; data: MacroProgress; macroKey?: MacroStyleKey };

export type MacroBarsProps = {
  rows: Row[];
};

// Category accent + SF Symbol per macro (single source: categoryAccent token).
const MACRO: Record<string, { color: string; icon: string }> = {
  Protein: { color: categoryAccent.protein, icon: 'circle.fill' },
  Carbs: { color: categoryAccent.carbs, icon: 'leaf.fill' },
  Fat: { color: categoryAccent.fat, icon: 'drop.fill' },
  Fibre: { color: categoryAccent.fibre, icon: 'circle.grid.2x2.fill' },
};

export function MacroBars({ rows }: MacroBarsProps) {
  return (
    <View style={{ gap: space.md }}>
      {rows.map(({ label, data, macroKey }) => {
        const meta = MACRO[macroKey ?? label];
        const tint = meta?.color ?? color.black;
        return (
          <View key={label} style={{ gap: space.xs }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                {meta ? <Icon name={meta.icon} size={11} color={tint} /> : null}
                <Text variant="footnote" color={color.gray700}>
                  {label}
                </Text>
              </View>
              <Text variant="footnote" color={color.gray500}>
                {Math.round(data.consumed)} / {Math.round(data.target)} g
              </Text>
            </View>
            <ProgressBar value={data.target > 0 ? data.consumed / data.target : 0} tint={tint} />
          </View>
        );
      })}
    </View>
  );
}
