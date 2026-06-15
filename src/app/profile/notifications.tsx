// E6 · Notification preferences
// TODO: Per-type toggles, quiet hours pickers, daily cap stepper
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function NotificationPrefsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          E6 · Notification preferences
        </Text>
      </View>
    </SafeAreaView>
  );
}
