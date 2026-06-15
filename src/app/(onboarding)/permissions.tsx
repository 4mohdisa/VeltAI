// A17 · Permissions
// TODO: HealthKit + Notifications explainers then native prompts
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function PermissionsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          A17 · Permissions
        </Text>
      </View>
    </SafeAreaView>
  );
}
