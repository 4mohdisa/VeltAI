// EmptyState (F7) — icon + one line + an optional suggested action. Used for any
// list with no data yet. Never leave a blank screen.
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';

export type EmptyStateProps = {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

export function EmptyState({
  icon = 'sparkles-outline',
  title,
  message,
  actionLabel,
  onAction,
  testID,
}: EmptyStateProps) {
  return (
    <View
      testID={testID}
      style={{ alignItems: 'center', justifyContent: 'center', padding: space['2xl'], gap: space.md }}
    >
      <Ionicons name={icon} size={40} color={color.gray400} />
      <Text variant="title3" color={color.black} style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {message ? (
        <Text variant="callout" color={color.gray500} style={{ textAlign: 'center' }}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: space.sm }}>
          <Button title={actionLabel} onPress={onAction} variant="secondary" fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}
