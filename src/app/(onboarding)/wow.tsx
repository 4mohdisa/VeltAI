// A15 · Wow moment
// TODO: Animated projection chart + plan timeline + lockout preview
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function WowScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          A15 · Wow moment
        </Text>
      </View>
    </SafeAreaView>
  );
}
