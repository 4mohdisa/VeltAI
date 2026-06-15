// A9 · Why
// TODO: Multi-line text input ~5 lines, Skip framed as useful
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function WhyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          A9 · Why
        </Text>
      </View>
    </SafeAreaView>
  );
}
