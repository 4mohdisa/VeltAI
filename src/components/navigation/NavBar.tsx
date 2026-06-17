// NavBar — our own top bar (headers are off globally). Left back affordance,
// centred title, optional right slot. Designed to sit at the top of a screen's
// SafeAreaView, so it does not add a safe-area inset itself.
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { GlassBackButton } from './GlassButtons';
import { Text } from '@/components/primitives/Text';
import { color, layout, space } from '@/lib/design/tokens';

export type NavBarProps = {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  borderless?: boolean;
};

export function NavBar({ title, showBack = true, onBack, right, borderless }: NavBarProps) {
  return (
    <View
      style={{
        height: layout.buttonHeight,
        justifyContent: 'center',
        borderBottomWidth: borderless ? 0 : 1,
        borderBottomColor: color.gray200,
      }}
    >
      {/* Title is centred independently of the side slots. */}
      <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }}>
        {title ? (
          <Text variant="bodyBold" color={color.black} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: space.sm,
        }}
      >
        <View style={{ minWidth: layout.tapTarget }}>
          {showBack ? <GlassBackButton onPress={onBack} /> : null}
        </View>
        <View style={{ minWidth: layout.tapTarget, alignItems: 'flex-end' }}>{right}</View>
      </View>
    </View>
  );
}
