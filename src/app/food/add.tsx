// C2 · Add menu
// 2×2 grid of large tappable cards: Scan food, Barcode, Voice, Saved foods.
// (Manual search lives in the food-log search bar, not here. No gym option.)
import { View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/primitives/Icon';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

type Method = {
  icon: string;
  label: string;
  description: string;
  route: string;
};

const METHODS: Method[] = [
  { icon: 'camera', label: 'Scan food', description: 'Snap your meal', route: '/food/photo-capture' },
  { icon: 'barcode', label: 'Barcode', description: 'Scan a package', route: '/food/barcode-scan' },
  { icon: 'mic', label: 'Voice', description: 'Describe it out loud', route: '/food/voice' },
  { icon: 'bookmark', label: 'Saved foods', description: 'One-tap re-add', route: '/food/saved' },
];

export default function AddMealScreen() {
  return (
    <SheetContent title="Add meal" onClose={() => router.canGoBack() && router.back()}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {METHODS.map((m) => (
          <Pressable
            key={m.label}
            onPress={() => router.push(m.route as never)}
            accessibilityLabel={`${m.label}. ${m.description}`}
            minTapTarget={false}
            style={{
              width: '47.5%',
              aspectRatio: 1,
              backgroundColor: color.gray100,
              borderRadius: radius.lg,
              padding: space.xl,
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: radius.full,
                backgroundColor: color.white,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={m.icon} size={24} color={color.black} />
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
    </SheetContent>
  );
}
