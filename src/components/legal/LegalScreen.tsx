// Shared layout for the legal documents (Terms, Privacy). Content is passed as
// data (heading + paragraph strings) so the copy lives in plain JS strings —
// apostrophes and quotes need no JSX escaping, and both docs render identically.
import type { JSX } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';

export type LegalSection = { heading: string; body: string[] };

export function LegalScreen({
  title,
  updated,
  intro,
  sections,
  backLabel,
}: {
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
  /** Only when the caller knows the previous screen — the docs are pushed from several places. */
  backLabel?: string;
}): JSX.Element {
  return (
    <Screen title={title} showBack backLabel={backLabel}>
      <Text variant="footnote" color={color.secondaryLabel}>
        Last updated {updated}
      </Text>
      {intro ? (
        <Text variant="body" color={color.gray800} style={{ marginTop: space.sm }}>
          {intro}
        </Text>
      ) : null}
      <View style={{ gap: space.xl, marginTop: space.lg }}>
        {sections.map((s, i) => (
          <View key={s.heading} style={{ gap: space.sm }}>
            <Text variant="title3" color={color.label}>
              {`${i + 1}. ${s.heading}`}
            </Text>
            {s.body.map((p, j) => (
              <Text key={j} variant="body" color={color.gray800}>
                {p}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </Screen>
  );
}
