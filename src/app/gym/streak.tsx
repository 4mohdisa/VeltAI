// D4 · Streak detail
// TODO: Streak top, upcoming 7 days actions, longest/total/freezes
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function StreakDetailScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          D4 · Streak detail
        </Text>
      </View>
    </SafeAreaView>
  );
}
