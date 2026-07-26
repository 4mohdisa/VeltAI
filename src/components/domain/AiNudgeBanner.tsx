// AiNudgeBanner (F4) — a dismissable in-app banner when an AI nudge fires while
// the app is open. Monochrome grey fill, black sparkles icon. Tap → relevant
// screen; X dismisses.
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { categoryAccent, color, radius, space, surface } from '@/lib/design/tokens';

export type AiNudgeBannerProps = {
  message: string;
  onPress?: () => void;
  onDismiss?: () => void;
};

export function AiNudgeBanner({ message, onPress, onDismiss }: AiNudgeBannerProps) {
  return (
    <Pressable
      onPress={onPress}
      haptic={false}
      minTapTarget={false}
      accessibilityLabel={message}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        backgroundColor: surface.card,
        borderRadius: radius.lg,
        padding: space.lg,
      }}
    >
      <Icon name="sparkles" size={18} color={categoryAccent.ai} />
      <Text variant="footnote" color={color.gray800} style={{ flex: 1 }}>
        {message}
      </Text>
      {onDismiss ? (
        <Pressable onPress={onDismiss} haptic={false} accessibilityLabel="Dismiss nudge">
          <Icon name="close" size={18} color={color.gray500} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
