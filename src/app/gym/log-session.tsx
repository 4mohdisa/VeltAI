// D2 · Log gym session
// TODO: Optional duration/effort/energy/notes, big Log it
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function LogSessionScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          D2 · Log gym session
        </Text>
      </View>
    </SafeAreaView>
  );
}
