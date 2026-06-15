// E12 · Delete Account flow
// TODO: Multi-step: confirm, list, type DELETE, final
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function DeleteAccountScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          E12 · Delete Account flow
        </Text>
      </View>
    </SafeAreaView>
  );
}
