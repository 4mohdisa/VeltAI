// A7 · Reflection
// TODO: No inputs, centered conditional copy block, Continue
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function ReflectionScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          A7 · Reflection
        </Text>
      </View>
    </SafeAreaView>
  );
}
