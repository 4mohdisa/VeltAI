// A8 · Goal
// TODO: Segmented goal type; weight slider + date picker if weight
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function GoalScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          A8 · Goal
        </Text>
      </View>
    </SafeAreaView>
  );
}
