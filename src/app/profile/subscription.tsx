// E4 · Subscription
// TODO: Plan, renewal date, Manage subscription, Restore Purchases
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function SubscriptionScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          E4 · Subscription
        </Text>
      </View>
    </SafeAreaView>
  );
}
