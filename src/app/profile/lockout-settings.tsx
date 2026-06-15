// E5 · Lockout settings
// TODO: Toggle, app picker, window, grace, emergency unlocks left
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function LockoutSettingsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          E5 · Lockout settings
        </Text>
      </View>
    </SafeAreaView>
  );
}
