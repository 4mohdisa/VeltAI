// F5 · Lockout blocked overlay (Strict mode)
// What the user sees when they open a blocked app during lockout. Shows which
// app, the "gym not logged" message, and the ways out: grace, emergency, or just
// log the gym. (Requires the Family Controls entitlement in production.)
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/primitives/Icon';

import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, radius, space } from '@/lib/design/tokens';

export default function LockoutBlockedScreen() {
  const { app } = useLocalSearchParams<{ app?: string }>();
  const appName = app ?? 'Instagram';
  const close = () => router.canGoBack() && router.back();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.gray900 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.lg }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: radius.full,
            backgroundColor: color.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="lock-closed" size={40} color={color.black} />
        </View>
        <Text variant="title1" color={color.white} style={{ textAlign: 'center' }}>
          {appName} is locked
        </Text>
        <Text variant="callout" color={color.gray300} style={{ textAlign: 'center' }}>
          You haven&apos;t logged today&apos;s gym session. Go, log it, and your apps open
          instantly.
        </Text>
      </View>

      <View style={{ padding: space.lg, gap: space.sm }}>
        <Button
          title="Log gym session"
          icon="barbell"
          onPress={() => {
            close();
            router.push('/gym/log-session');
          }}
        />
        <Button
          title="Use grace period (5 min)"
          variant="secondary"
          onPress={() => {
            showToast({ message: '5 minutes of grace started.', tone: 'info' });
            close();
          }}
        />
        <Button
          title="Emergency unlock"
          variant="tertiary"
          onPress={() => showToast({ message: 'Emergency unlock needs a 4-digit code.', tone: 'warn' })}
        />
      </View>
    </SafeAreaView>
  );
}
