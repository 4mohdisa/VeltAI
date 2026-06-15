// C2 · Add meal entry method
// TODO: 2x2 grid cards: Photo, Voice, Barcode, Manual
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function AddMealScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          C2 · Add meal entry method
        </Text>
      </View>
    </SafeAreaView>
  );
}
