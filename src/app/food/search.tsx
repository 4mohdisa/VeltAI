// C9 · Manual food search
// TODO: Search bar, OFF + recent results, add-custom link
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function ManualSearchScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          C9 · Manual food search
        </Text>
      </View>
    </SafeAreaView>
  );
}
