// E9 · Privacy
// TODO: Policy/Terms/EULA links, data export (Phase 2)
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          E9 · Privacy
        </Text>
      </View>
    </SafeAreaView>
  );
}
