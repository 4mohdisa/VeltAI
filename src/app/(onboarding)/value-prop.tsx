// A2 · Value prop carousel
// TODO: Three swipeable cards, bold word + line, skip-to-end top-right
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function ValuePropScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          A2 · Value prop carousel
        </Text>
      </View>
    </SafeAreaView>
  );
}
