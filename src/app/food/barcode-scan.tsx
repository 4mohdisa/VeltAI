// C7 · Barcode scan
// TODO: Auto-detect viewfinder with reticle, no shutter
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function BarcodeScanScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          C7 · Barcode scan
        </Text>
      </View>
    </SafeAreaView>
  );
}
