// SwipeableRow — swipe-to-delete (HIG §6.3) driven by Reanimated via gesture-
// handler's ReanimatedSwipeable (NOT a JS animation). Reveals a destructive red
// Delete action; the action confirms before deleting (global destructive rule).
// There is ALWAYS a non-gesture alternative: tapping the row opens the edit sheet
// whose Delete button does the same thing — so the feature is fully accessible.
import { useRef } from 'react';
import { Alert, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { ReactNode } from 'react';

import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { haptics } from '@/lib/haptics';

export type SwipeableRowProps = {
  children: ReactNode;
  onDelete: () => void;
  confirmTitle?: string;
  confirmMessage?: string;
  deleteLabel?: string;
};

export function SwipeableRow({
  children,
  onDelete,
  confirmTitle = 'Delete item?',
  confirmMessage,
  deleteLabel = 'Delete',
}: SwipeableRowProps) {
  const ref = useRef<SwipeableMethods>(null);

  const confirmDelete = () => {
    haptics.warning(); // destructive confirm appears (HIG §9), paired with the alert
    Alert.alert(confirmTitle, confirmMessage, [
      { text: 'Cancel', style: 'cancel', onPress: () => ref.current?.close() },
      {
        text: deleteLabel,
        style: 'destructive',
        onPress: () => {
          haptics.impactHeavy(); // destructive swipe completes
          ref.current?.close();
          onDelete();
        },
      },
    ]);
  };

  const renderRightActions = () => (
    <Pressable
      onPress={confirmDelete}
      accessibilityLabel={deleteLabel}
      minTapTarget={false}
      style={{
        // Monochrome destructive affordance — intent is carried by the trash
        // glyph + label + the confirm dialog (matching the destructive Button),
        // not an accent fill. Black is the app's only filled-action colour.
        backgroundColor: color.primary,
        justifyContent: 'center',
        alignItems: 'center',
        width: 88,
        gap: space.xs,
      }}
    >
      <Icon name="trash" size={20} color={color.onPrimary} />
      <Text variant="caption" color={color.onPrimary}>
        {deleteLabel}
      </Text>
    </Pressable>
  );

  return (
    <ReanimatedSwipeable
      ref={ref}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={renderRightActions}
    >
      <View>{children}</View>
    </ReanimatedSwipeable>
  );
}
