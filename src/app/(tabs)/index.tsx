// B1 · Dashboard
// TODO: Three zones: streak/xp/rank, gym status + macros ring, plan + lockout
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          B1 · Dashboard
        </Text>
      </View>
    </SafeAreaView>
  );
}
