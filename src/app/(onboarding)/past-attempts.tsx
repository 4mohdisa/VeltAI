// A5 · What have you tried
// TODO: Six multi-select cards, Skip available
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function PastAttemptsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          A5 · What have you tried
        </Text>
      </View>
    </SafeAreaView>
  );
}
