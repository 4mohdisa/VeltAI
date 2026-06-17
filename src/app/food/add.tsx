// C2 · Add menu
// 2×2 grid of large tappable cards: Scan food, Barcode, Voice, Saved foods.
// (Manual search lives in the food-log search bar, not here. No gym option.)
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/primitives/Icon';

import { SheetContent } from '@/components/navigation/SheetContent';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

type Method = {
  icon: string;
  labelKey: string;
  descriptionKey: string;
  route: string;
};

const METHODS: Method[] = [
  { icon: 'camera', labelKey: 'addMenu.scanFood', descriptionKey: 'addMenu.snapMeal', route: '/food/photo-capture' },
  { icon: 'barcode', labelKey: 'addMenu.barcode', descriptionKey: 'addMenu.scanPackage', route: '/food/barcode-scan' },
  { icon: 'mic', labelKey: 'addMenu.voice', descriptionKey: 'addMenu.describeOutLoud', route: '/food/voice' },
  { icon: 'bookmark', labelKey: 'addMenu.savedFoods', descriptionKey: 'addMenu.oneTapReadd', route: '/food/saved' },
];

export default function AddMealScreen() {
  const { t } = useTranslation();
  return (
    <SheetContent title={t('addMenu.title')} onClose={() => router.canGoBack() && router.back()}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {METHODS.map((m) => (
          <Pressable
            key={m.labelKey}
            onPress={() => router.push(m.route as never)}
            accessibilityLabel={`${t(m.labelKey)}. ${t(m.descriptionKey)}`}
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
                {t(m.labelKey)}
              </Text>
              <Text variant="footnote" color={color.gray500}>
                {t(m.descriptionKey)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </SheetContent>
  );
}
