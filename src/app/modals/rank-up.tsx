// F2 · Rank-up modal
// TODO: Animated badge reveal, rank name, unlocks list, Continue
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function RankUpModalScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          F2 · Rank-up modal
        </Text>
      </View>
    </SafeAreaView>
  );
}
