// AiNudgeBanner (F4) — a dismissable in-app banner when an AI nudge fires while
// the app is open. Monochrome grey fill, black sparkles icon. Tap → relevant
// screen; X dismisses.
import { View } from 'react-native';

import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { categoryAccent, color, radius, space, surface } from '@/lib/design/tokens';

export type AiNudgeBannerProps = {
  message: string;
  onPress?: () => void;
  onDismiss?: () => void;
};

// Content and dismiss are SIBLING pressables (not nested) so VoiceOver can reach
// both; the outer View only paints the banner chrome.
export function AiNudgeBanner({ message, onPress, onDismiss }: AiNudgeBannerProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        backgroundColor: surface.card,
        borderRadius: radius.lg,
        padding: space.lg,
      }}
    >
      <Pressable
        onPress={onPress}
        haptic={false}
        minTapTarget={false}
        accessibilityLabel={message}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md }}
      >
        <Icon name="sparkles" size={18} color={categoryAccent.ai} />
        <Text variant="footnote" color={color.gray800} style={{ flex: 1 }}>
          {message}
        </Text>
      </Pressable>
      {onDismiss ? (
        <Pressable onPress={onDismiss} haptic={false} accessibilityLabel="Dismiss nudge">
          <Icon name="close" size={18} color={color.gray500} />
        </Pressable>
      ) : null}
    </View>
  );
}
