// HealthDisclaimer — App Store guideline 1.4.1 (physical harm): apps that compute
// nutrition/fitness targets must visibly state they are not medical advice.
// Placed on: onboarding targets, goals settings, and inside the Terms.
import type { JSX } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/primitives/Icon';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

export const HEALTH_DISCLAIMER_TEXT =
  'Lume provides general nutrition and fitness information. It is not medical advice. ' +
  'Consult a healthcare professional before making significant changes to your diet or exercise routine.';

export function HealthDisclaimer(): JSX.Element {
  return (
    <View
      accessibilityRole="text"
      style={{
        flexDirection: 'row',
        gap: space.sm,
        padding: space.md,
        borderRadius: radius.md,
        backgroundColor: color.gray50,
      }}
    >
      <Icon name="information-circle-outline" size={16} color={color.tertiaryLabel} style={{ marginTop: 1 }} />
      <Text variant="caption" color={color.secondaryLabel} style={{ flex: 1 }}>
        {HEALTH_DISCLAIMER_TEXT}
      </Text>
    </View>
  );
}
