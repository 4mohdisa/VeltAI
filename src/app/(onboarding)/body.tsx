// A10 · About you
// TODO: Weight/height sliders, age stepper, sex segmented, units toggle
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function BodyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          A10 · About you
        </Text>
      </View>
    </SafeAreaView>
  );
}
