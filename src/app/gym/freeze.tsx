// D5 · Apply streak freeze
// Confirmation sheet: "Use 1 of your X freezes for [date]?" X-left dismisses,
// tick-right applies. Freezes protect a day from breaking the streak.
import { View } from 'react-native';
import { router } from 'expo-router';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Card } from '@/components/display/Card';
import { Icon } from '@/components/primitives/Icon';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { useGym, applyFreeze } from '@/lib/data';

export default function FreezeScreen() {
  const {
    data: { streak },
  } = useGym();
  const close = () => {
    if (router.canGoBack()) router.back();
  };

  return (
    <SheetContent
      title="Streak freeze"
      onClose={close}
      onDone={() => {
        applyFreeze();
        showToast({ message: 'Freeze applied — tomorrow is protected.', tone: 'success' });
        close();
      }}
      doneDisabled={streak.freezesAvailable === 0}
    >
      <Card>
        <View style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.md }}>
          <Icon name="snow" size={44} color={color.gray500} />
          <Text variant="title3" color={color.black} style={{ textAlign: 'center' }}>
            Use 1 of your {streak.freezesAvailable} freezes for tomorrow?
          </Text>
          <Text variant="callout" color={color.gray500} style={{ textAlign: 'center' }}>
            A freeze protects your {streak.current}-day streak on a planned rest day — it just
            keeps the streak alive.
          </Text>
        </View>
      </Card>
    </SheetContent>
  );
}
