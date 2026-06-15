// F5 · Lockout blocked overlay
// TODO: Which app, gym-not-logged message, grace/emergency
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function LockoutBlockedScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          F5 · Lockout blocked overlay
        </Text>
      </View>
    </SafeAreaView>
  );
}
