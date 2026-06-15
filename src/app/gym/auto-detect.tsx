// D3 · HealthKit auto-detect (standalone)
// The auto-detect prompt also appears inline on D1; this routed version stands
// alone for deep links. Confirm/decline a HealthKit-detected workout.
import { View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { formatDuration } from '@/lib/formatting';
import { mockDetectedWorkout } from '@/lib/mock/data';

export default function AutoDetectScreen() {
  const goBack = () => {
    if (router.canGoBack()) router.back();
  };

  return (
    <Screen
      title="Workout detected"
      showBack
      footer={
        <View style={{ gap: space.sm }}>
          <Button
            title="Yes, log as today's session"
            onPress={() => {
              showToast({ message: '+25 XP (+5 verified) · Logged from Health.', tone: 'success' });
              goBack();
            }}
          />
          <Button title="Not the gym" variant="secondary" onPress={goBack} />
        </View>
      }
    >
      <Card>
        <View style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.md }}>
          <Ionicons name="heart" size={40} color={color.accentText} />
          <Text variant="title3" color={color.black}>
            {mockDetectedWorkout.type}
          </Text>
          <Text variant="callout" color={color.gray500}>
            {mockDetectedWorkout.start}–{mockDetectedWorkout.end} ·{' '}
            {formatDuration(mockDetectedWorkout.durationMin)}
          </Text>
        </View>
      </Card>
    </Screen>
  );
}
