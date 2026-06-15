// Text — typed wrapper that maps a `variant` to the typography tokens. This is
// the only place font sizes come from; never hardcode fontSize at a call site.
// allowFontScaling is left on (RN default) so Dynamic Type works everywhere.
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { color as colors, type as typeScale, type TypeVariant } from '@/lib/design/tokens';

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  color?: string;
};

export function Text({ variant = 'body', color = colors.gray900, style, ...rest }: TextProps) {
  return <RNText style={[typeScale[variant], { color }, style]} {...rest} />;
}
