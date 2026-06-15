// D6 · Gym session history
// TODO: Reverse-chron sessions, duration, verification badge, notes
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function GymHistoryScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          D6 · Gym session history
        </Text>
      </View>
    </SafeAreaView>
  );
}
