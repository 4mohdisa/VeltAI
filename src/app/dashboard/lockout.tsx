// B3 · Lockout status
// TODO: Blocked apps, grace remaining, emergency unlocks, grace button
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function LockoutStatusScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          B3 · Lockout status
        </Text>
      </View>
    </SafeAreaView>
  );
}
