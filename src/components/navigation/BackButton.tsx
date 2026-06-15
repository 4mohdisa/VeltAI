// BackButton — chevron that pops the stack. Falls back to a provided handler
// (e.g. dismiss a flow) when there is nothing to pop.
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Pressable } from '@/components/primitives/Pressable';
import { color, layout } from '@/lib/design/tokens';

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
      style={{ width: layout.tapTarget, height: layout.tapTarget, alignItems: 'flex-start', justifyContent: 'center' }}
    >
      <Ionicons name="chevron-back" size={28} color={tint} />
    </Pressable>
  );
}
