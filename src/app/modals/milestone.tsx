// F3 · Streak milestone modal
// TODO: Flame animation, milestone count, XP bonus, Continue
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function MilestoneModalScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          F3 · Streak milestone modal
        </Text>
      </View>
    </SafeAreaView>
  );
}
