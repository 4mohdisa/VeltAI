// A4 · What is getting in the way
// TODO: Eight multi-select option cards, Continue when >=1 picked
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function StrugglesScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          A4 · What is getting in the way
        </Text>
      </View>
    </SafeAreaView>
  );
}
