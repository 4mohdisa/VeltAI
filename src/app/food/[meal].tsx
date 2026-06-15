// C11 · Meal detail
// TODO: Food items list, inline edit, destructive delete w/ confirm
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function MealDetailScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          C11 · Meal detail
        </Text>
      </View>
    </SafeAreaView>
  );
}
