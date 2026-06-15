// A11 · Your day
// TODO: Three native time pickers: wake, sleep, gym
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function ScheduleScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          A11 · Your day
        </Text>
      </View>
    </SafeAreaView>
  );
}
