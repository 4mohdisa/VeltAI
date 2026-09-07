// CardHeaderRow — the header line the design file puts at the top of almost
// every card: a small category-accent glyph, the card's name, an optional
// right-aligned scope word ("Today", "Last 7 days"), and a chevron when the card
// pushes somewhere.
//
// Colour rule (tokens.ts): the glyph is the ONE tinted thing here — it encodes
// which kind of data the card holds. The title, the scope and the chevron stay
// monochrome. Passing no `tint` gives a fully monochrome header.
//
// Presentational only: it takes what to draw and renders it. Cards keep owning
// their own press handling, so a header inside a tappable Card is not itself a
// second tap target (VoiceOver would otherwise read two controls for one card).
import { View } from 'react-native';

import { Icon } from '@/components/primitives/Icon';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';

export type CardHeaderRowProps = {
  title: string;
  /** SF Symbol (or legacy Ionicons name — see Icon's map). */
  icon?: string;
  /** Functional accent for the glyph only; omit to keep it monochrome. */
  tint?: string;
  /** Trailing scope word, e.g. "Today". */
  scope?: string;
  /** Show the disclosure chevron (the card pushes a detail view). */
  chevron?: boolean;
};

export function CardHeaderRow({ title, icon, tint, scope, chevron = false }: CardHeaderRowProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      {icon ? <Icon name={icon} size={17} color={tint ?? color.label} /> : null}
      <Text variant="bodyMedium" color={color.label} accessibilityRole="header" numberOfLines={1} style={{ flexShrink: 1 }}>
        {title}
      </Text>
      {scope ? (
        <Text variant="footnote" color={color.tertiaryLabel} style={{ marginLeft: 'auto' }} numberOfLines={1}>
          {scope}
        </Text>
      ) : null}
      {chevron ? (
        // Decorative: the whole card carries the label and the action.
        <Icon name="chevron-forward" size={14} color={color.tertiaryLabel} style={scope ? undefined : { marginLeft: 'auto' }} />
      ) : null}
    </View>
  );
}
