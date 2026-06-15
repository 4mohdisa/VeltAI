// A19 · First plan generating
// TODO: Loading with rotating tips, auto-advance to Dashboard
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function GeneratingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          A19 · First plan generating
        </Text>
      </View>
    </SafeAreaView>
  );
}
