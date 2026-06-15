// D5 · Apply streak freeze
// TODO: Confirm use 1 of X freezes for a date
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function FreezeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          D5 · Apply streak freeze
        </Text>
      </View>
    </SafeAreaView>
  );
}
