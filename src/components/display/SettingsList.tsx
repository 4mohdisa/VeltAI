// SettingsList — Apple-style grouped settings list. A section title above a
// card of rows. Each row is a link (chevron), a toggle (Switch), or a plain
// value. Keeps every settings screen short and consistent.
import { Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from './Card';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

export type SettingsRowProps = {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
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
  const labelColor = row.destructive ? color.error : color.black;

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
        minHeight: 52,
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
            backgroundColor: row.destructive ? color.errorLight : color.gray100,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={row.icon} size={17} color={row.destructive ? color.error : color.gray700} />
        </View>
      ) : null}

      <Text variant="body" color={labelColor} style={{ flex: 1 }}>
        {row.label}
      </Text>

      {row.value ? (
        <Text variant="callout" color={color.gray500}>
          {row.value}
        </Text>
      ) : null}

      {kind === 'toggle' ? (
        <Switch
          value={!!row.switchValue}
          onValueChange={row.onToggle}
          trackColor={{ true: color.accent, false: color.gray300 }}
          accessibilityLabel={row.label}
        />
      ) : kind === 'link' ? (
        <Ionicons name="chevron-forward" size={18} color={color.gray400} />
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
