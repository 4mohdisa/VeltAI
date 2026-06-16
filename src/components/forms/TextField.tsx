// TextField — filled input (grey fill, no border). On focus it flips to white
// with a 1px black border. Errors are signalled by the FieldShell message, not
// colour. Min height 52pt; multiline grows.
import { useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { FieldShell, type FieldShellProps } from './FieldShell';
import { color, radius, space, type, layout, surface } from '@/lib/design/tokens';

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

  // Outline only appears on focus (or error); otherwise the grey fill defines it.
  const outlined = focused || !!error;

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
          backgroundColor: disabled ? color.gray150 : outlined ? surface.inputFocused : surface.input,
          borderColor: color.black,
          borderWidth: outlined ? 1 : 0,
          borderRadius: radius.md,
          paddingVertical: space.lg,
          paddingHorizontal: space.xl,
          fontSize: type.body.fontSize,
          lineHeight: type.body.lineHeight,
          color: color.gray800,
          minHeight: multiline ? layout.buttonHeight * 2.2 : layout.buttonHeight,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </FieldShell>
  );
}
