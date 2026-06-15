// A6 · Fitness app frustrations
// TODO: Six options + free-text, all optional, prominent Skip
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function FrustrationsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          A6 · Fitness app frustrations
        </Text>
      </View>
    </SafeAreaView>
  );
}
