// SettingsList — Apple-style grouped settings list. A section title above a
// card of rows. Each row is a link (chevron), a toggle (Switch), or a plain
// value. Keeps every settings screen short and consistent.
import { Switch, View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, layout, radius, space, surface } from '@/lib/design/tokens';
import { useLargeText } from '@/lib/design/dynamicType';

export type SettingsRowProps = {
  icon?: string;
  label: string;
  value?: string;
  kind?: 'link' | 'toggle' | 'plain';
  switchValue?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  destructive?: boolean;
};

function Row({ row, showDivider }: { row: SettingsRowProps; showDivider: boolean }) {
  const kind = row.kind ?? (row.onPress ? 'link' : 'plain');
  const labelColor = row.destructive ? color.black : color.black;
  // HIG §2.2b: at large text sizes stack the label above its value rather than
  // letting them collide on one line.
  const large = useLargeText();

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
        minHeight: layout.buttonHeight,
        borderTopWidth: showDivider ? 1 : 0,
        borderTopColor: color.gray100,
      }}
    >
      {row.icon ? (
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: radius.sm,
            backgroundColor: row.destructive ? color.gray100 : color.gray100,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={row.icon} size={17} color={row.destructive ? color.black : color.gray700} />
        </View>
      ) : null}

      <View
        style={{
          flex: 1,
          flexDirection: large ? 'column' : 'row',
          alignItems: large ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: large ? space.xs : space.md,
        }}
      >
        <Text variant="body" color={labelColor} style={large ? undefined : { flexShrink: 1 }}>
          {row.label}
        </Text>
        {row.value ? (
          <Text variant="callout" color={color.gray500}>
            {row.value}
          </Text>
        ) : null}
      </View>

      {kind === 'toggle' ? (
        <Switch
          value={!!row.switchValue}
          onValueChange={row.onToggle}
          trackColor={{ true: color.black, false: color.gray300 }}
          accessibilityLabel={row.label}
        />
      ) : kind === 'link' ? (
        <Icon name="chevron-forward" size={18} color={color.gray400} />
      ) : null}
    </View>
  );

  if (kind === 'link' && row.onPress) {
    return (
      <Pressable haptic={false} minTapTarget={false} onPress={row.onPress} accessibilityLabel={row.label}>
        {body}
      </Pressable>
    );
  }
  return body;
}

export type SettingsListProps = {
  title?: string;
  /** Optional explanatory footer below the group (HIG §6.2). */
  footer?: string;
  rows: SettingsRowProps[];
};

// Inset-grouped (HIG §6.2): white rows on the screen's subtle grouped background.
// Uses surface.cardElevated (white) rather than the generic grey Card so the
// rows read as the standard iOS Settings group against backgroundAlt.
export function SettingsList({ title, footer, rows }: SettingsListProps) {
  return (
    <View>
      {title ? (
        <Text
          variant="footnote"
          color={color.secondaryLabel}
          style={{ marginBottom: space.sm, marginLeft: space.xs, textTransform: 'uppercase', letterSpacing: 1 }}
        >
          {title}
        </Text>
      ) : null}
      <View style={{ backgroundColor: surface.cardElevated, borderRadius: radius.lg, overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <Row key={row.label} row={row} showDivider={i > 0} />
        ))}
      </View>
      {footer ? (
        <Text
          variant="footnote"
          color={color.secondaryLabel}
          style={{ marginTop: space.sm, marginLeft: space.xs, marginRight: space.xs }}
        >
          {footer}
        </Text>
      ) : null}
    </View>
  );
}
