// A19 · First plan generating (loading)
// Rotating tips while the (mocked) AI builds the first plan, then auto-advances
// to the Dashboard. Completing onboarding sets the persisted flag and awards the
// one-time +50 XP.
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Text } from '@/components/primitives/Text';
import { ProgressBar } from '@/components/display/ProgressBar';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { setHasCompletedOnboarding } from '@/lib/storage/secureStore';

const TIPS = [
  'Building your weekly meal plan…',
  'Setting your daily calorie target…',
  'Scheduling your gym sessions…',
  'Personalising your lockout…',
];

export default function GeneratingScreen() {
  const [tip, setTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTip((t) => (t + 1) % TIPS.length), 1100);

    const finish = setTimeout(async () => {
      await setHasCompletedOnboarding(true);
      router.replace('/(tabs)');
      showToast({ message: '+50 XP · Welcome to Veltai.', tone: 'success' });
    }, 4600);

    return () => {
      clearInterval(interval);
      clearTimeout(finish);
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.xl }}>
        <ActivityIndicator size="large" color={color.accent} />
        <Text variant="title3" color={color.black} style={{ textAlign: 'center', minHeight: 56 }}>
          {TIPS[tip]}
        </Text>
        <View style={{ width: '70%' }}>
          <ProgressBar value={(tip + 1) / TIPS.length} />
        </View>
      </View>
    </SafeAreaView>
  );
}
