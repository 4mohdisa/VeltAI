// C10 · Custom food form
// TODO: Fields: name, cals/100g, protein, carbs, fat, fibre
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function CustomFoodScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          C10 · Custom food form
        </Text>
      </View>
    </SafeAreaView>
  );
}
