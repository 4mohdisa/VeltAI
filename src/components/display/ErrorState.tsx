// ErrorState (F8) — plain-language error + a Retry button. (In production Sentry
// captures the underlying error silently; here it is presentational.)
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';

export type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  testID?: string;
};

export function ErrorState({
  title = 'Something went wrong',
  message = 'We hit a snag loading this. Please try again.',
  onRetry,
  retryLabel = 'Retry',
  testID,
}: ErrorStateProps) {
  return (
    <View
      testID={testID}
      style={{ alignItems: 'center', justifyContent: 'center', padding: space['2xl'], gap: space.md }}
    >
      <Ionicons name="alert-circle-outline" size={40} color={color.error} />
      <Text variant="title3" color={color.black} style={{ textAlign: 'center' }}>
        {title}
      </Text>
      <Text variant="callout" color={color.gray500} style={{ textAlign: 'center' }}>
        {message}
      </Text>
      {onRetry ? (
        <View style={{ marginTop: space.sm }}>
          <Button title={retryLabel} onPress={onRetry} variant="secondary" fullWidth={false} icon="refresh" />
        </View>
      ) : null}
    </View>
  );
}
