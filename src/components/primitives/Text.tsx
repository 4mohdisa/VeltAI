// AppText — typed text primitive that maps a `variant` to the typography tokens
// and resolves the correct font family (SF Pro Display for body/headings, SF Pro
// Rounded for stat numbers + display). This is the only place font sizes / font
// families come from; never hardcode them at a call site. allowFontScaling is
// left on (RN default) so Dynamic Type works everywhere.
//
// Exported as both `AppText` (new name) and `Text` (back-compat for existing
// imports). Screens are NOT mass-migrated in this prompt.
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { color as colors, textStyle, type TypeVariant } from '@/lib/design/tokens';

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  color?: string;
};

export function AppText({ variant = 'body', color = colors.gray800, style, ...rest }: TextProps) {
  return <RNText style={[textStyle(variant), { color }, style]} {...rest} />;
}

// Back-compat alias — existing `import { Text } from '.../Text'` keeps working.
export const Text = AppText;
