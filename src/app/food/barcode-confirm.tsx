// C8 · Barcode confirm
// TODO: Product name/image/nutrition, serving size picker, Save
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function BarcodeConfirmScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          C8 · Barcode confirm
        </Text>
      </View>
    </SafeAreaView>
  );
}
