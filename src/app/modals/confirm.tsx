// F9 · Confirmation sheet (reusable)
// Bottom-presented confirm for destructive actions. Params drive the copy:
// title, message, confirmLabel, destructive. On confirm we toast + dismiss (the
// caller performs the real action in production).
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';

export default function ConfirmScreen() {
  const params = useLocalSearchParams<{
    title?: string;
    message?: string;
    confirmLabel?: string;
    destructive?: string;
  }>();

  const destructive = params.destructive === 'true';
  const close = () => router.canGoBack() && router.back();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['bottom']}>
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: space.lg, gap: space.md }}>
        <Text variant="title3" color={color.black}>
          {params.title ?? 'Are you sure?'}
        </Text>
        {params.message ? (
          <Text variant="callout" color={color.gray500}>
            {params.message}
          </Text>
        ) : null}
        <Button
          title={params.confirmLabel ?? 'Confirm'}
          variant={destructive ? 'destructive' : 'primary'}
          onPress={() => {
            showToast({ message: 'Done.', tone: 'info' });
            close();
          }}
        />
        <Button title="Cancel" variant="tertiary" onPress={close} />
      </View>
    </SafeAreaView>
  );
}
