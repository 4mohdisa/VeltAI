// ProfileAvatarButton — the design's way into Profile (V2): a 44pt glass circle
// floating at the top-right of every tab — Summary, Food and Gym — level with
// the date eyebrow. It shows the user's initials when there is a name and a
// person glyph when there is not, and pushes /profile.
//
// Extracted from Summary, which had the only copy, so the three tabs cannot
// drift apart. Position is unchanged from Summary's: insets.top + space.xs
// (the design's 64pt on a 59pt inset phone), right: space.lg (the design's 16).
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Avatar } from '@/components/display/Avatar';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { GlassSurface } from './GlassButtons';
import { useUserStore } from '@/lib/data/userStore';
import { color, layout, radius, space } from '@/lib/design/tokens';

/** The design's 22pt person glyph (GymScreen / FoodScreen / SummaryScreen). */
export const PROFILE_GLYPH = 22;

export function ProfileAvatarButton() {
  const insets = useSafeAreaInsets();
  const name = useUserStore((s) => s.profile.name);
  return (
    <Pressable
      onPress={() => router.push('/profile')}
      haptic={false}
      minTapTarget={false}
      accessibilityLabel="Profile and settings"
      style={{ position: 'absolute', top: insets.top + space.xs, right: space.lg }}
    >
      <GlassSurface
        style={{
          width: layout.tapTarget,
          height: layout.tapTarget,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {name ? (
          <Avatar name={name} size={layout.tapTarget} />
        ) : (
          <Icon name="person" size={PROFILE_GLYPH} color={color.label} />
        )}
      </GlassSurface>
    </Pressable>
  );
}
