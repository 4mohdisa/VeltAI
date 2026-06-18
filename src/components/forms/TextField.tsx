// TextField — white input with an ALWAYS-PRESENT 1px border (so nothing reflows
// on focus): only the border COLOUR changes neutral-grey → black on focus, never
// its width or the box size. Content is vertically centred. Errors are signalled
// by the FieldShell message, not colour. Height 52pt; multiline grows.
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

  // Border is ALWAYS 1px (no reflow). Only the colour changes: neutral grey at
  // rest, black on focus or error. The box size never changes.
  const borderColor = focused || error ? color.black : color.gray300;

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
          backgroundColor: disabled ? color.gray150 : color.white,
          borderColor,
          borderWidth: layout.borderWidth, // always present — width never changes
          borderRadius: radius.md,
          paddingHorizontal: space.xl,
          fontSize: type.body.fontSize,
          color: color.gray800,
          // Single-line: fixed height + vertical-centre (no lineHeight, which
          // offsets iOS TextInput). Multiline: grow from the top.
          ...(multiline
            ? {
                minHeight: layout.buttonHeight * 2.2,
                paddingVertical: space.lg,
                lineHeight: type.body.lineHeight,
                textAlignVertical: 'top' as const,
              }
            : {
                height: layout.buttonHeight,
                paddingVertical: 0,
                textAlignVertical: 'center' as const,
              }),
        }}
      />
    </FieldShell>
  );
}
