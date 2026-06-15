// C6 · Voice entry
// TODO: Mic button center, live transcript, stop then review
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function VoiceEntryScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          C6 · Voice entry
        </Text>
      </View>
    </SafeAreaView>
  );
}
