// A3 · Sign in / sign up
// TODO: Apple button top, email below equal, existing-account link
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function AuthScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          A3 · Sign in / sign up
        </Text>
      </View>
    </SafeAreaView>
  );
}
