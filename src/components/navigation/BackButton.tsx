// BackButton — chevron.left SF Symbol in a soft grey circle (per UI & Design
// System). Pops the stack, or runs a provided handler.
import { View } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { color, radius, surface } from '@/lib/design/tokens';

export type BackButtonProps = {
  onPress?: () => void;
  tint?: string;
  testID?: string;
};

export function BackButton({ onPress, tint = color.black, testID }: BackButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      haptic={false}
      accessibilityLabel="Go back"
      testID={testID}
      style={{ alignItems: 'flex-start', justifyContent: 'center' }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.full,
          backgroundColor: tint === color.white ? 'transparent' : surface.card,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="chevron-back" size={20} color={tint} />
      </View>
    </Pressable>
  );
}
