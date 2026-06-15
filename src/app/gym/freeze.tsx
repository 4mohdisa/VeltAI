// D5 · Apply streak freeze
// Confirmation: "Use 1 of your X freezes for [date]?" Freezes protect a day from
// breaking the streak. Max 2 held; must apply before midnight UTC.
import { View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { mockStreak } from '@/lib/mock/data';

export default function FreezeScreen() {
  const goBack = () => {
    if (router.canGoBack()) router.back();
  };

  return (
    <Screen
      title="Streak freeze"
      showBack
      footer={
        <View style={{ gap: space.sm }}>
          <Button
            title="Apply freeze for tomorrow"
            icon="snow"
            disabled={mockStreak.freezesAvailable === 0}
            onPress={() => {
              showToast({ message: 'Freeze applied — tomorrow is protected.', tone: 'success' });
              goBack();
            }}
          />
          <Button title="Cancel" variant="tertiary" onPress={goBack} />
        </View>
      }
    >
      <Card>
        <View style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.md }}>
          <Ionicons name="snow" size={44} color={color.gray500} />
          <Text variant="title3" color={color.black} style={{ textAlign: 'center' }}>
            Use 1 of your {mockStreak.freezesAvailable} freezes for tomorrow?
          </Text>
          <Text variant="callout" color={color.gray500} style={{ textAlign: 'center' }}>
            A freeze protects your {mockStreak.current}-day streak on a planned rest day. It won&apos;t
            award XP — it just keeps the streak alive.
          </Text>
        </View>
      </Card>
    </Screen>
  );
}
