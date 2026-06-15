// B2 · Today's plan detail
// TODO: Vertical timeline wake to bed, meal slots + 3 foods, gym marked
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function PlanDetailScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          B2 · Today's plan detail
        </Text>
      </View>
    </SafeAreaView>
  );
}
