// SettingsList — Apple-style grouped settings list. A section title above a
// card of rows. Each row is a link (chevron), a toggle (Switch), or a plain
// value. Keeps every settings screen short and consistent.
import { Switch, View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { Card } from './Card';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, layout, radius, space } from '@/lib/design/tokens';
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
  rows: SettingsRowProps[];
};

export function SettingsList({ title, rows }: SettingsListProps) {
  return (
    <View>
      {title ? (
        <Text
          variant="footnote"
          color={color.gray500}
          style={{ marginBottom: space.sm, marginLeft: space.xs, textTransform: 'uppercase', letterSpacing: 1 }}
        >
          {title}
        </Text>
      ) : null}
      <Card padded={false}>
        {rows.map((row, i) => (
          <Row key={row.label} row={row} showDivider={i > 0} />
        ))}
      </Card>
    </View>
  );
}
