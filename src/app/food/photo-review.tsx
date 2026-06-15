// C4 · Photo review
// TODO: Photos top, detected items w/ confidence opacity, total + Save
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function PhotoReviewScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          C4 · Photo review
        </Text>
      </View>
    </SafeAreaView>
  );
}
