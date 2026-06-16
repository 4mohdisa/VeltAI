// FieldShell — the shared chrome every form field wears: label (with optional
// required marker), the control, and a helper OR error line below. Keeps spacing
// and the label/error typography consistent across all fields.
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';

export type FieldShellProps = {
  label?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
};

export function FieldShell({
  label,
  helper,
  error,
  required,
  children,
}: FieldShellProps & { children: ReactNode }) {
  return (
    <View style={{ gap: space.xs }}>
      {label ? (
        <Text variant="footnote" color={color.gray700}>
          {label}
          {required ? ' *' : ''}
        </Text>
      ) : null}
      {children}
      {error ? (
        <Text variant="caption" color={color.black} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" color={color.gray500}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
