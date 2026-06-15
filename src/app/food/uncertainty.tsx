// C5 · Uncertainty prompt
// TODO: Single question card, four options, live calorie preview
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function UncertaintyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          C5 · Uncertainty prompt
        </Text>
      </View>
    </SafeAreaView>
  );
}
