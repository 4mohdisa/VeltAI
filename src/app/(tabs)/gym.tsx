// D1 · Gym log
// TODO: Streak counter, 30-day calendar grid, today's log button
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function GymLogScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          D1 · Gym log
        </Text>
      </View>
    </SafeAreaView>
  );
}
