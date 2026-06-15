// F4 · AI nudge banner
// TODO: Top banner, dismissable, tap goes to relevant screen
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function NudgeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          F4 · AI nudge banner
        </Text>
      </View>
    </SafeAreaView>
  );
}
