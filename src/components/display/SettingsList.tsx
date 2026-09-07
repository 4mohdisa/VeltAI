// SettingsList — Apple-style grouped settings list. A section title above a
// card of rows. Each row is a link (chevron), a toggle (Switch), or a plain
// value. Keeps every settings screen short and consistent.
//
// Restyled in place for the design-file pass (DECISIONS.md "Design-file UI
// pass"): every importer is a covered settings screen, so this needs no variant.
// The group is now a WHITE card at radius.xl with shadow.sm lifting off the grey
// page, each row carries a tinted 28pt icon chip, and rows are separated by a
// hairline in surface.divider inset past the chip rather than by a full-width
// rule. Behaviour, props and accessibility are untouched.
import { Switch, View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { accent, color, layout, radius, shadow, space, surface } from '@/lib/design/tokens';
import { useLargeText } from '@/lib/design/dynamicType';

/** Icon chip edge — the design's 28pt tinted square. */
const CHIP = 28;
/** Separators start past the chip, so the text column reads as one list. */
const DIVIDER_INSET = space.lg + CHIP + space.md;

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
  // Destructive rows read in the functional red (HIG: destructive ≠ neutral).
  const labelColor = row.destructive ? accent.red : color.label;
  // HIG §2.2b: at large text sizes stack the label above its value rather than
  // letting them collide on one line.
  const large = useLargeText();

  const body = (
    <View>
      {showDivider ? (
        <View
          style={{
            height: layout.hairline,
            backgroundColor: surface.divider,
            marginLeft: row.icon ? DIVIDER_INSET : space.lg,
          }}
        />
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
          minHeight: layout.buttonHeight,
        }}
      >
        {row.icon ? (
          <View
            style={{
              width: CHIP,
              height: CHIP,
              borderRadius: radius.sm,
              backgroundColor: color.light1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={row.icon} size={17} color={row.destructive ? accent.red : color.label} />
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
            <Text variant="callout" color={color.secondaryLabel}>
              {row.value}
            </Text>
          ) : null}
        </View>

        {kind === 'toggle' ? (
          <Switch
            value={!!row.switchValue}
            onValueChange={row.onToggle}
            trackColor={{ true: color.primary, false: color.light2 }}
            accessibilityRole="switch"
            accessibilityLabel={row.label}
            accessibilityState={{ checked: !!row.switchValue }}
          />
        ) : kind === 'link' ? (
          // Decorative disclosure chevron — hidden from VoiceOver (the row is labeled).
          <Icon name="chevron-forward" size={14} color={color.tertiaryLabel} />
        ) : null}
      </View>
    </View>
  );

  // Combined label so VoiceOver reads "Subscription, Premium" as one element.
  const combinedLabel = row.value ? `${row.label}, ${row.value}` : row.label;

  if (kind === 'link' && row.onPress) {
    return (
      <Pressable
        haptic={false}
        minTapTarget={false}
        onPress={row.onPress}
        accessible
        accessibilityRole={row.destructive ? 'button' : 'button'}
        accessibilityLabel={combinedLabel}
        accessibilityHint={row.destructive ? 'Double tap to continue' : undefined}
        // The design fills a pressed row rather than dimming it.
        style={({ pressed }) => (pressed ? { backgroundColor: color.light1 } : null)}
      >
        {body}
      </Pressable>
    );
  }
  // Plain value rows are a single static element (not a control).
  if (kind === 'plain') {
    return (
      <View accessible accessibilityLabel={combinedLabel}>
        {body}
      </View>
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
          variant="label"
          color={color.secondaryLabel}
          style={{ marginBottom: space.sm, marginLeft: space.lg, textTransform: 'uppercase', letterSpacing: 1 }}
        >
          {title}
        </Text>
      ) : null}
      {/* The shadow lives on the outer view and the clip on the inner one:
          iOS clips a view's own shadow when that same view sets overflow. */}
      <View style={{ backgroundColor: surface.cardElevated, borderRadius: radius.xl, ...shadow.sm }}>
        <View style={{ borderRadius: radius.xl, overflow: 'hidden' }}>
          {rows.map((row, i) => (
            <Row key={row.label} row={row} showDivider={i > 0} />
          ))}
        </View>
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
