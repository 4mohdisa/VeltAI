// A18 · Paywall
// TODO: 14 days free headline, dated trial, why-14-days, Restore
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function PaywallScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          A18 · Paywall
        </Text>
      </View>
    </SafeAreaView>
  );
}
