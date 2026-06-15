// A16 · Lockout setup
// TODO: Toggle, app picker, enforcement window, grace period
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function LockoutSetupScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          A16 · Lockout setup
        </Text>
      </View>
    </SafeAreaView>
  );
}
