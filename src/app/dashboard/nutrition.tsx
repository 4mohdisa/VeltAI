// B4 · Nutrition detail
// TODO: Calories vs target bar, per-macro bars, per-meal breakdown
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function NutritionDetailScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          B4 · Nutrition detail
        </Text>
      </View>
    </SafeAreaView>
  );
}
