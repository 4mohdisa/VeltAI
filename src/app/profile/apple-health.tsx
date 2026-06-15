// E7 · Apple Health
// TODO: Connection status, data types read, deep link to Settings
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function AppleHealthScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          E7 · Apple Health
        </Text>
      </View>
    </SafeAreaView>
  );
}
