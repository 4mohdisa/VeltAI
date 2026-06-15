// F4 · AI nudge (transparent modal host)
// Presented as a transparent overlay; the nudge banner sits near the top and is
// dismissable. Tap → the relevant screen. (Usually shown inline on a tab; this
// route exists for push-triggered nudges.)
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { AiNudgeBanner } from '@/components/domain/AiNudgeBanner';
import { space } from '@/lib/design/tokens';

export default function NudgeScreen() {
  const { message } = useLocalSearchParams<{ message?: string }>();
  const dismiss = () => router.canGoBack() && router.back();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']} pointerEvents="box-none">
      <View style={{ padding: space.lg }} pointerEvents="box-none">
        <AiNudgeBanner
          message={message ?? "It's 18:00 — your gym window. Lockout starts soon."}
          onPress={dismiss}
          onDismiss={dismiss}
        />
      </View>
    </SafeAreaView>
  );
}
