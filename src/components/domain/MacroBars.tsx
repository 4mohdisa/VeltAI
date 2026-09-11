// MacroBars — protein / carbs / fat (+ fibre) progress bars. Each macro carries
// its category accent on its small icon and its progress bar ONLY — the label,
// value number, and track stay monochrome (functional colour, not decoration).
import { View } from 'react-native';

import { Icon } from '@/components/primitives/Icon';
import { ProgressBar } from '@/components/display/ProgressBar';
import { Text } from '@/components/primitives/Text';
import { categoryAccent, color, space } from '@/lib/design/tokens';
import { useLargeText } from '@/lib/design/dynamicType';
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

/** A macro against its target for the Summary's design Macros card. `consumed`
 *  is null when the app does not record that macro at all — the row then says
 *  "Not tracked" rather than printing a zero the user never ate. */
export type MacroTargetRow = { label: string; macroKey: MacroStyleKey; consumed: number | null; target: number };

/** The design's Summary macro rows (SummaryScreen.dc.html, V16): the name, the
 *  amount in rounded stat type over "/ target g", and a 12pt bar in the macro's
 *  accent on a light-2 track. Separate from MacroBars, which the nutrition
 *  detail still uses as it was. */
export function MacroTargetRows({ rows }: { rows: MacroTargetRow[] }) {
  return (
    <View style={{ gap: space.lg }}>
      {rows.map(({ label, macroKey, consumed, target }) => {
        const tint = MACRO[macroKey]?.color ?? color.black;
        return (
          <View key={macroKey} style={{ gap: space.sm }} accessible accessibilityLabel={consumed == null ? `${label}, not tracked, target ${Math.round(target)} grams` : `${label}, ${Math.round(consumed)} of ${Math.round(target)} grams`}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
              <Text variant="callout" color={color.label} style={{ flex: 1, fontWeight: '500', lineHeight: 20 }}>
                {label}
              </Text>
              {consumed == null ? (
                <Text variant="footnote" color={color.tertiaryLabel}>
                  Not tracked · target {Math.round(target)} g
                </Text>
              ) : (
                <>
                  <Text variant="statSmall" color={color.label}>
                    {Math.round(consumed)}
                  </Text>
                  <Text variant="footnote" color={color.tertiaryLabel}>
                    / {Math.round(target)} g
                  </Text>
                </>
              )}
            </View>
            <ProgressBar
              value={consumed != null && target > 0 ? consumed / target : 0}
              tint={tint}
              track={color.light2}
              height={MACRO_BAR_H}
            />
          </View>
        );
      })}
    </View>
  );
}

/** The design's 12pt macro bar. */
export const MACRO_BAR_H = 12;

export function MacroBars({ rows }: MacroBarsProps) {
  // HIG §2.2b: stack label above value at large text sizes instead of colliding.
  const large = useLargeText();
  return (
    <View style={{ gap: space.md }}>
      {rows.map(({ label, data, macroKey }) => {
        const meta = MACRO[macroKey ?? label];
        const tint = meta?.color ?? color.black;
        return (
          <View key={label} style={{ gap: space.xs }}>
            <View
              style={{
                flexDirection: large ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: large ? 'flex-start' : 'center',
                gap: large ? space.xs : space.sm,
              }}
            >
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
