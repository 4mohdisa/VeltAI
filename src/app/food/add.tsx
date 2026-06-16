// C2 · Add meal — entry method picker
// Full-screen with four large tappable cards in a 2×2 grid: Photo, Voice,
// Barcode, Manual. Each has an icon, label, and one-line description.
import { View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/primitives/Icon';

import { Screen } from '@/components/navigation/Screen';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space, shadow } from '@/lib/design/tokens';

type Method = {
  icon: string;
  label: string;
  description: string;
  route: string;
};

const METHODS: Method[] = [
  { icon: 'camera', label: 'Photo', description: 'Snap your meal', route: '/food/photo-capture' },
  { icon: 'mic', label: 'Voice', description: 'Describe it out loud', route: '/food/voice' },
  { icon: 'barcode', label: 'Barcode', description: 'Scan a package', route: '/food/barcode-scan' },
  { icon: 'search', label: 'Manual', description: 'Search or add custom', route: '/food/search' },
];

export default function AddMealScreen() {
  return (
    <Screen title="Add meal" showBack>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {METHODS.map((m) => (
          <Pressable
            key={m.label}
            onPress={() => router.push(m.route as never)}
            accessibilityLabel={`${m.label}. ${m.description}`}
            minTapTarget={false}
            style={[
              {
                width: '47.5%',
                aspectRatio: 1,
                backgroundColor: color.white,
                borderColor: color.gray200,
                borderWidth: 1,
                borderRadius: radius.lg,
                padding: space.lg,
                justifyContent: 'space-between',
              },
              shadow.sm,
            ]}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: radius.full,
                backgroundColor: color.accentLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={m.icon} size={24} color={color.accentText} />
            </View>
            <View style={{ gap: space.xs }}>
              <Text variant="title3" color={color.black}>
                {m.label}
              </Text>
              <Text variant="footnote" color={color.gray500}>
                {m.description}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
