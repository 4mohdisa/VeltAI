// A14 · Your cuisines
// TODO: Cuisine multi-select chips + cooks-at-home segmented
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function CuisinesScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          A14 · Your cuisines
        </Text>
      </View>
    </SafeAreaView>
  );
}
