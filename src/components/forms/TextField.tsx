// TextField — single- or multi-line text input wrapped in FieldShell.
// Border states follow the tokens doc: gray300 default, black on focus,
// error on error. Min height 44pt; multiline grows.
import { useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { FieldShell, type FieldShellProps } from './FieldShell';
import { color, radius, space, type, layout } from '@/lib/design/tokens';

export type TextFieldProps = FieldShellProps &
  Omit<TextInputProps, 'style'> & {
    testID?: string;
  };

export function TextField({
  label,
  helper,
  error,
  required,
  disabled,
  multiline,
  testID,
  accessibilityLabel,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? color.error : focused ? color.black : color.gray300;

  return (
    <FieldShell label={label} helper={helper} error={error} required={required} disabled={disabled}>
      <TextInput
        {...inputProps}
        testID={testID}
        accessibilityLabel={accessibilityLabel ?? label}
        editable={!disabled}
        multiline={multiline}
        placeholderTextColor={color.gray400}
        onFocus={(e) => {
          setFocused(true);
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          inputProps.onBlur?.(e);
        }}
        style={{
          backgroundColor: disabled ? color.gray100 : color.white,
          borderColor,
          borderWidth: 1,
          borderRadius: radius.md,
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
          fontSize: type.body.fontSize,
          lineHeight: type.body.lineHeight,
          color: color.gray900,
          minHeight: multiline ? layout.tapTarget * 2.5 : layout.tapTarget,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </FieldShell>
  );
}
