// ErrorState (F8) — plain-language error + a Retry button. (In production Sentry
// captures the underlying error silently; here it is presentational.)
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/primitives/Icon';

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
  title,
  message,
  onRetry,
  retryLabel,
  testID,
}: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <View
      testID={testID}
      style={{ alignItems: 'center', justifyContent: 'center', padding: space['2xl'], gap: space.md }}
    >
      <Icon name="alert-circle-outline" size={40} color={color.black} />
      <Text variant="title3" color={color.black} style={{ textAlign: 'center' }}>
        {title ?? t('errorState.title')}
      </Text>
      <Text variant="callout" color={color.gray500} style={{ textAlign: 'center' }}>
        {message ?? t('errorState.message')}
      </Text>
      {onRetry ? (
        <View style={{ marginTop: space.sm }}>
          <Button title={retryLabel ?? t('errorState.retry')} onPress={onRetry} variant="secondary" fullWidth={false} icon="refresh" />
        </View>
      ) : null}
    </View>
  );
}
