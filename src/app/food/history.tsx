// C12 · Meal history
// TODO: List by date desc, total cals + gym status, tap to day
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function MealHistoryScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          C12 · Meal history
        </Text>
      </View>
    </SafeAreaView>
  );
}
