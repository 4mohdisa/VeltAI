// HealthDisclaimer — App Store guideline 1.4.1 (physical harm): apps that compute
// nutrition/fitness targets must visibly state they are not medical advice.
// Placed on: onboarding targets, goals settings and nutrition detail. The text
// lives in healthDisclaimer.text in each locale file.
import type { JSX } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/primitives/Icon';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

export function HealthDisclaimer(): JSX.Element {
  const { t } = useTranslation();
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
        {t('healthDisclaimer.text')}
      </Text>
    </View>
  );
}
